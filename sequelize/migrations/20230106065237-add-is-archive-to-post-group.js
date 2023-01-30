'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'posts_groups', schema: schemaName },
      `is_archived`,
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'posts_groups', schema: schemaName },
      `is_archived`,
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }
    );
  },
};
