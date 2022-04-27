'use strict';

const schemaName = process.env.POSTGRES_SCHEMA;
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
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'posts', key: 'id' },
        },
        edited_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        old_data: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        new_data: {
          type: Sequelize.JSONB,
          allowNull: false
        }
      },
      {
        schema: schemaName,
      }
    )

    await queryInterface.addIndex(tableName, ['post_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(tableName);
  }
};
