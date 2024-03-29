'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'post_edited_history';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          autoIncrement: true,
          type: Sequelize.INTEGER,
        },
        post_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        edited_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        old_data: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        new_data: {
          type: Sequelize.JSONB,
          allowNull: false,
        },
      },
      {
        schema: schemaName,
      }
    );

    await queryInterface.addIndex(tableName, ['post_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(tableName);
  },
};
