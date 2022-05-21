'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'comment_edited_history';

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
        comment_id: {
          type: Sequelize.INTEGER,
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

    await queryInterface.addIndex(tableName, ['comment_id'], {
      as: `idx_${tableName}_comment_id`
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(tableName);
  },
};
