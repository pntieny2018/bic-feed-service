// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.POSTGRES_SCHEMA;
const tableName = 'posts';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          autoIncrement: true,
          type: Sequelize.INTEGER,
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        updated_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
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
        mentions: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: '[]',
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
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
