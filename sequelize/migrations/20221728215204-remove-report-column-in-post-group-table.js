'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts_groups';
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn({
          tableName: tableName,
          schema: schemaName,
        },
        'is_reported'
      );
    } catch (e) {}
  },

  async down(queryInterface, Sequelize) {}
};