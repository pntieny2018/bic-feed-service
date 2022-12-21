'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts_groups';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'is_reported'
    );
  },

  async down (queryInterface, Sequelize) {
  }
};
