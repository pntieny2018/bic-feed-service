'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName,
        schema: schemaName,
      },
      'views'
    );
    await queryInterface.removeColumn(
      {
        tableName,
        schema: schemaName,
      },
      'giphy_id'
    );
    await queryInterface.removeColumn(
      {
        tableName,
        schema: schemaName,
      },
      'hashtags_json'
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
