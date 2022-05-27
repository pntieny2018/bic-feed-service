// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const tableName = 'posts';
const schemaName = process.env.DB_SCHEMA;
const dbVersion = parseInt(process.env.DB_VER) ?? 14;
const genRandomUUID = dbVersion < 14 ? 'public.gen_random_uuid()' : 'gen_random_uuid()';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal(genRandomUUID),
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        updated_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        comments_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_important: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        important_expired_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        can_share: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        can_comment: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        can_react: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        is_draft: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        schema: schemaName,
      }
    );

    await queryInterface.addIndex(tableName, ['created_by']);
    await queryInterface.addIndex(tableName, ['is_draft', 'is_important', 'created_at']);
    await queryInterface.addIndex(tableName, ['important_expired_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
