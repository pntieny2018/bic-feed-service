'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName, schema: schemaName }, `quiz_id`, {
      type: Sequelize.UUID,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn({ tableName, schema: schemaName }, `quiz_id`);
  },
};
