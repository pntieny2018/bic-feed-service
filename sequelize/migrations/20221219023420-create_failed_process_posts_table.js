require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'failed_process_posts';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
        },
        post_id: {
          type: Sequelize.UUID,
          onDelete: 'NO ACTION',
          allowNull: false,
        },
        is_expired_processing: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        reason: {
          type: Sequelize.STRING(32),
          allowNull: true,
        },
        post_json: {
          type: Sequelize.JSONB,
          allowNull: true,
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
    await queryInterface.addIndex(tableName, ['post_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
