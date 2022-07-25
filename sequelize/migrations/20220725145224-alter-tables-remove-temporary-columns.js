/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';
require('dotenv').config();

const { Sequelize } = require('sequelize-typescript');

const schema = process.env.DB_SCHEMA;

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
  MENTIONABLE_TYPE: 'mentionable_type',
  ENTITY_ID: 'entity_id',
  POST_ID: 'post_id',
  REACTION_NAME: 'reaction_name',
  COMMENT_ID: 'comment_id',
};

const UNIQUE = 'unique';
const PRIMARY = 'primary key';

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
const shouldRemoveIndexes = [
  {
    table: TABLES.COMMENTS_REACTIONS,
    key: 'comment_reaction_user_index',
  },
  {
    table: TABLES.POSTS_REACTIONS,
    key: 'post_reaction_user_index',
  },
  {
    table: TABLES.USER_NEWSFEED,
    key: 'user_id_post_id_index',
  },
  {
    table: TABLES.USERS_SEEN_POSTS,
    key: 'uid_user_seen_post_user_post',
  },
];
const shouldUpdateContraints = [
  {
    table: TABLES.POSTS_GROUPS,
    key: 'posts_groups_pkey',
    type: PRIMARY,
    columns: [COLUMNS.POST_ID, COLUMNS.GROUP_ID],
  },
  {
    table: TABLES.USER_MARK_READ_POSTS,
    key: 'users_mark_read_posts_pkey',
    type: PRIMARY,
    columns: [COLUMNS.POST_ID, COLUMNS.USER_ID],
  },
];

const shouldUpdateIndexes = [
  {
    table: TABLES.COMMENTS_REACTIONS,
    key: 'comments_reactions_comment_id_reaction_name_created_by',
    type: UNIQUE,
    columns: [COLUMNS.COMMENT_ID, COLUMNS.REACTION_NAME, COLUMNS.CREATED_BY],
  },
  {
    table: TABLES.MENTIONS,
    key: 'mentions_mentionable_type_entity_id_user_id',
    type: UNIQUE,
    columns: [COLUMNS.MENTIONABLE_TYPE, COLUMNS.ENTITY_ID, COLUMNS.USER_ID],
  },
  {
    table: TABLES.POSTS,
    key: 'posts_created_by',
    type: null,
    columns: [COLUMNS.CREATED_BY],
  },
  {
    table: TABLES.POSTS_REACTIONS,
    key: 'posts_reactions_post_id_reaction_name_created_by',
    type: UNIQUE,
    columns: [COLUMNS.POST_ID, COLUMNS.REACTION_NAME, COLUMNS.CREATED_BY],
  },
  {
    table: TABLES.USER_NEWSFEED,
    key: 'user_newsfeed_post_id_user_id',
    type: UNIQUE,
    columns: [COLUMNS.POST_ID, COLUMNS.USER_ID],
  },
  {
    table: TABLES.USER_NEWSFEED,
    key: 'user_newsfeed_user_id',
    type: null,
    columns: [COLUMNS.USER_ID],
  },
  {
    table: TABLES.USER_MARK_READ_POSTS,
    key: 'users_mark_read_posts_user_id_post_id',
    type: UNIQUE,
    columns: [COLUMNS.POST_ID, COLUMNS.USER_ID],
  },
  {
    table: TABLES.USERS_SEEN_POSTS,
    key: 'users_seen_posts_user_id_post_id',
    type: UNIQUE,
    columns: [COLUMNS.POST_ID, COLUMNS.USER_ID],
  },
];


module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // remove temporary "old" columns
      await removeOldColumn(queryInterface, transaction);

      // remove wrong indexes from 20220719162024-alter-tables-update-some-columns-to-uuid
      await removeWrongIndexes(queryInterface, transaction);

      // update lacking contraints from 20220719162024-alter-tables-update-some-columns-to-uuid
      await updateContraints(queryInterface, transaction);

      // update index to use new columns instead of "old_XYZ" column
      await updateIndexes(queryInterface, transaction);

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
      await undoRemoveOldColumn(queryInterface, transaction);
      // dont need undo wrong indexes, indexes, contraints
      await transaction.commit();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      await transaction.rollback();
      throw e;
    }
  },
};

async function removeOldColumn(queryInterface, transaction) {
  for (let i = 0; i < shouldUpdatedTables.length; i++) {
    const table = shouldUpdatedTables[i];
    for (let j = 0; j < table.columns.length; j++) {
      await queryInterface.removeColumn(
        { schema, tableName: table.name },
        'old_' + table.columns[j],
        {
          transaction,
        }
      );
      console.log(`[Remove column] old_${table.columns[j]}`);
    }
  }
}

async function undoRemoveOldColumn(queryInterface, transaction) {
  for (let i = 0; i < shouldUpdatedTables.length; i++) {
    const table = shouldUpdatedTables[i];
    for (let j = 0; j < table.columns.length; j++) {
      await queryInterface.addColumn(
        { schema, tableName: table.name },
        'old_' + table.columns[j],
        {
          type: Sequelize.DataTypes.INTEGER,
          allowNull: true,
          transaction,
        }
      );
      console.log(`[Re-create column] old_${table.columns[j]}`);
    }
  }
}

async function removeWrongIndexes(queryInterface, transaction) {
  for (let i = 0; i < shouldRemoveIndexes.length; i++) {

    const index = shouldRemoveIndexes[i];
    await queryInterface.removeIndex(
      { schema, tableName: index.table },
      index.key,
      {
        transaction,
      }
    );
    console.log(`[Remove wrong index] ${index.table}.${index.key}`);

  }
}

async function updateContraints(queryInterface, transaction) {
  for (let i = 0; i < shouldUpdateContraints.length; i++) {
    const contraint = shouldUpdateContraints[i];
    await queryInterface.sequelize.query(
      `ALTER TABLE ${schema}.${contraint.table} DROP CONSTRAINT IF EXISTS ${contraint.key}`,
      {
        transaction,
      }
    );
    await queryInterface.addConstraint(
      { schema, tableName: contraint.table },
      {
        name: contraint.key,
        fields: contraint.columns,
        type: PRIMARY,
        transaction
      }
    );
    console.log(`[Update contraint] ${contraint.table}.${contraint.key}`);
  }
}

async function updateIndexes(queryInterface, transaction) {
  for (let i = 0; i < shouldUpdateIndexes.length; i++) {
    const index = shouldUpdateIndexes[i];
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS ${schema}.${index.key}`,
      {
        transaction,
      }
    );

    console.log(index);
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

    console.log(`[Update index] ${index.table}.${index.key}`);
  }
}
