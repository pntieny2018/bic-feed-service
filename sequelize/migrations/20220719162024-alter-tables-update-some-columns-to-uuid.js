/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';
require('dotenv').config();

const { Sequelize } = require('sequelize-typescript');

const groupSequelize = new Sequelize({
  dialect: process.env.GROUP_DB_CONNECTION,
  host: process.env.GROUP_DB_HOST,
  port: parseInt(process.env.GROUP_DB_PORT),
  database: process.env.GROUP_DB_DATABASE,
  username: process.env.GROUP_DB_USERNAME,
  password: process.env.GROUP_DB_PASSWORD,
  searchPath: process.env.GROUP_DB_SCHEMA,
  define: {
    schema: process.env.GROUP_DB_SCHEMA,
    underscored: true,
    timestamps: true,
  },
  dialectOptions: {
    prependSearchPath: true,
  },
  ssl: process.env.GROUP_DB_SSL === 'true',
  native: process.env.GROUP_DB_SSL === 'true',
  operatorsAliases: null,
});



const schema = process.env.DB_SCHEMA;
const groupSchema = process.env.GROUP_DB_SCHEMA;

const TABLES = {
  CATEGORIES: 'categories',
  COMMENTS: 'comments',
  COMMENTS_REACTIONS: 'comments_reactions',
  FOLLOWS: 'follows',
  MEDIA: 'media',
  MENTIONS: 'mentions',
  POSTS: 'posts',
  POSTS_GROUPS: 'posts_groups',
  POSTS_REACTIONS: 'posts_reactions',
  RECENT_SEARCHES: 'recent_searches',
  SERIES: 'series',
  USER_NEWSFEED: 'user_newsfeed',
  USER_MARK_READ_POSTS: 'users_mark_read_posts',
  USERS_SEEN_POSTS: 'users_seen_posts',
};

const COLUMNS = {
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by',
  USER_ID: 'user_id',
  GROUP_ID: 'group_id',
  POST_ID: 'post_id',
  COMMENT_ID: 'comment_id',
  REACTION_NAME: 'reaction_name',
};

const MAP_TO_USER_ID_COLLUMNS = [
  COLUMNS.CREATED_BY,
  COLUMNS.UPDATED_BY,
  COLUMNS.USER_ID
];

const MAP_TO_GROUP_ID_COLLUMNS = [
  COLUMNS.GROUP_ID,
]

const UNIQUE = 'unique';

const shouldUpdatedTables = [
  {
    name: TABLES.CATEGORIES,
    columns: [COLUMNS.CREATED_BY, COLUMNS.UPDATED_BY],
  },
  {
    name: TABLES.COMMENTS,
    columns: [COLUMNS.CREATED_BY, COLUMNS.UPDATED_BY],
  },
  {
    name: TABLES.COMMENTS_REACTIONS,
    columns: [COLUMNS.CREATED_BY],
  },
  {
    name: TABLES.FOLLOWS,
    columns: [COLUMNS.USER_ID, COLUMNS.GROUP_ID],
  },
  {
    name: TABLES.MEDIA,
    columns: [COLUMNS.CREATED_BY],
  },
  {
    name: TABLES.MENTIONS,
    columns: [COLUMNS.USER_ID],
  },
  {
    name: TABLES.POSTS,
    columns: [COLUMNS.CREATED_BY, COLUMNS.UPDATED_BY],
  },
  {
    name: TABLES.POSTS_GROUPS,
    columns: [COLUMNS.GROUP_ID],
  },
  {
    name: TABLES.POSTS_REACTIONS,
    columns: [COLUMNS.CREATED_BY],
  },
  {
    name: TABLES.RECENT_SEARCHES,
    columns: [COLUMNS.CREATED_BY, COLUMNS.UPDATED_BY],
  },
  {
    name: TABLES.SERIES,
    columns: [COLUMNS.CREATED_BY, COLUMNS.UPDATED_BY],
  },
  {
    name: TABLES.USER_NEWSFEED,
    columns: [COLUMNS.USER_ID],
  },
  {
    name: TABLES.USER_MARK_READ_POSTS,
    columns: [COLUMNS.USER_ID],
  },
  {
    name: TABLES.USERS_SEEN_POSTS,
    columns: [COLUMNS.USER_ID],
  },
];

const shouldRecreateIndex = [
  {
    table: TABLES.CATEGORIES,
    key: 'categories_created_by',
    type: null,
    columns: [COLUMNS.CREATED_BY],
  },
  {
    table: TABLES.COMMENTS_REACTIONS,
    key: 'comment_reaction_user_index',
    type: UNIQUE,
    columns: [COLUMNS.COMMENT_ID, COLUMNS.REACTION_NAME, COLUMNS.CREATED_BY],
  },
  {
    table: TABLES.FOLLOWS,
    key: 'follows_user_id_group_id',
    type: UNIQUE,
    columns: [COLUMNS.USER_ID, COLUMNS.GROUP_ID],
  },
  {
    table: TABLES.POSTS_REACTIONS,
    key: 'post_reaction_user_index',
    columns: [COLUMNS.POST_ID, COLUMNS.REACTION_NAME, COLUMNS.CREATED_BY],
    type: UNIQUE,
  },
  {
    table: TABLES.USER_NEWSFEED,
    key: 'user_id_post_id_index',
    columns: [COLUMNS.USER_ID, COLUMNS.POST_ID],
    type: UNIQUE,
  },
  {
    table: TABLES.USERS_SEEN_POSTS,
    key: 'uid_user_seen_post_user_post',
    columns: [COLUMNS.USER_ID, COLUMNS.POST_ID],
    type: UNIQUE,
  },
];


module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await groupSequelize.authenticate(); //connect group database

      const groups = await getGroupsFromGroupService();
      const users = await getUsersFromGroupService();
      await removeIndex(queryInterface, transaction);
      await migrateTables(queryInterface, transaction, groups, users);
      await reCreateIndex(queryInterface, transaction);

      await transaction.commit();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await removeIndex(queryInterface, transaction);
      await migrateUndoTables(queryInterface, transaction);
      await reCreateIndex(queryInterface, transaction);
      await transaction.commit();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      await transaction.rollback();
      throw e;
    }
  },
};

async function getGroupsFromGroupService() {
  const groups = await groupSequelize.query(
    `SELECT id, old_id FROM ${groupSchema}.group WHERE deleted_at IS NULL`,
    { raw: true, type: Sequelize.QueryTypes.SELECT });
  return groups;
}

async function getUsersFromGroupService() {
  const users = await groupSequelize.query(
    `SELECT id, old_id FROM ${groupSchema}.user WHERE deleted_at IS NULL`,
    { raw: true, type: Sequelize.QueryTypes.SELECT }
  );
  return users;
}

async function removeIndex(queryInterface, transaction) {
  for (let i = 0; i < shouldRecreateIndex.length; i++) {
    const index = shouldRecreateIndex[i];
    await queryInterface.removeIndex(
      { schema, tableName: index.table },
      index.key,
      { transaction }
    );
    console.log(`[Remove index] ${index.table}.${index.key}`);
  }
}

async function reCreateIndex(queryInterface, transaction) {
  for (let i = 0; i < shouldRecreateIndex.length; i++) {
    const index = shouldRecreateIndex[i];
    if (index.type === 'unique') {
      await queryInterface.addIndex(
        {
          schema,
          tableName: index.table,
        },
        index.columns,
        {
          name: index.key,
          unique: true,
          transaction,
        }
      );
    } else {
      await queryInterface.addIndex(
        {
          schema,
          tableName: index.table,
        },
        index.columns,
        {
          name: index.key,
          transaction
        }
      );
    }

    console.log(`[Add index] ${index.table}.${index.key}`);
  }
}

async function migrateTables(queryInterface, transaction, groups, users) {
  const groupsDictionary = {};
  groups.forEach(group => {
    groupsDictionary[group.old_id] = group.id;
  });

  const usersDictionary = {};
  users.forEach(user => {
    usersDictionary[user.old_id] = user.id;
  });

  for (let i = 0; i < shouldUpdatedTables.length; i++) {
    const table = shouldUpdatedTables[i];
    console.log('[migrate table]', table.name);
    await renameColumns(table, queryInterface, transaction);
    await migrateColumnData(table, groupsDictionary, usersDictionary, queryInterface, transaction);
  }
}
async function renameColumns(table, queryInterface, transaction) {
  for (let i = 0; i < table.columns.length; i++) {

    await queryInterface.renameColumn(
      { schema, tableName: table.name },
      table.columns[i],
      'old_' + table.columns[i],
      {
        transaction,
      }
    );
    console.log(`[Rename column] ${table.name}.${table.columns[i]} to old_${table.columns[i]}`);

    await queryInterface.addColumn(
      { schema, tableName: table.name },
      table.columns[i],
      {
        type: Sequelize.DataTypes.UUID,
      },
      { transaction }
    );
    console.log(`[Add new column] ${table.name}.${table.columns[i]}`);
  }
}

async function migrateColumnData(table, groupsDictionary, usersDictionary, queryInterface, transaction) {
  const queries = [];
  for (let i = 0; i < table.columns.length; i++) {
    const distinctValues = await getColumnData(table, table.columns[i], queryInterface, transaction);
    const hasInvalidData = checkInvalidData(table.columns[i], distinctValues, groupsDictionary, usersDictionary);
    if (hasInvalidData) {
      throw new Error('hasInvalidData');
    }
    distinctValues.forEach(value => {
      queries.push(getUpdateColumnQuery(table, table.columns[i], value, groupsDictionary, usersDictionary))
    })
  }
  for (let i = 0; i < queries.length; i++) {
    console.info('[Migrate data query]', queries[i]);
    await queryInterface.sequelize.query(queries[i], { transaction })
  }
}

async function getColumnData(table, column, queryInterface, transaction) {
  const result = await queryInterface.sequelize.query(
    `SELECT DISTINCT old_${column} as ${column} FROM ${schema}.${table.name}`,
    {
      raw: true,
      type: Sequelize.QueryTypes.SELECT,
      transaction,
    }
  );
  console.info('[Get current data query]', `SELECT DISTINCT old_${column} as ${column} FROM ${schema}.${table.name}`)
  return result.map((row) => row[column]);
}

function checkInvalidData(column, values, groupsDictionary, usersDictionary) {
  let validValues = [];
  if (MAP_TO_USER_ID_COLLUMNS.includes(column)) {
    validValues = Object.keys(usersDictionary);
  } else if (MAP_TO_GROUP_ID_COLLUMNS.includes(column)) {
    validValues = Object.keys(groupsDictionary);
  } else {
    throw new Error(`The column ${column} is invalid`)
  }
  const invalidValues = values.filter((value) => !validValues.includes(String(value)));
  console.log(`[Invalid data in ${column} column]`, invalidValues);
  return invalidValues.length > 0;
}

function getUpdateColumnQuery(table, column, oldValue, groupsDictionary, usersDictionary) {
  if (MAP_TO_USER_ID_COLLUMNS.includes(column)) {
    return `UPDATE ${schema}.${table.name} SET ${column} = '${usersDictionary[String(oldValue)]}' WHERE ${'old_' + column} = ${oldValue}`;
  } else if (MAP_TO_GROUP_ID_COLLUMNS.includes(column)) {
    return `UPDATE ${schema}.${table.name} SET ${column} = '${groupsDictionary[String(oldValue)]}' WHERE ${'old_' + column} = ${oldValue}`;
  }
  throw new Error(`The column ${table.name}.${column} is invalid`)
}

async function migrateUndoTables(queryInterface, transaction) {
  for (let i = 0; i < shouldUpdatedTables.length; i++) {
    const table = shouldUpdatedTables[i];
    await undoColumns(table, queryInterface, transaction);
  }
}

async function undoColumns(table, queryInterface, transaction) {
  for (let i = 0; i < table.columns.length; i++) {
    await queryInterface.removeColumn(
      { schema, tableName: table.name },
      table.columns[i],
      {
        transaction,
      }
    );
    console.log(`[Remove temp column] ${table.name}.${table.columns[i]} to old_${table.columns[i]}`);

    await queryInterface.renameColumn(
      { schema, tableName: table.name },
      'old_' + table.columns[i],
      table.columns[i],
      {
        transaction,
      }
    );

    console.log(`[Undo rename column] ${table.name}.${table.columns[i]} to old_${table.columns[i]}`);

  }
}
