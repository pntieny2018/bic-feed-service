'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'report_content_details';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      {
        tableName: tableName,
        schema: schemaName,
      },
      `${tableName}_created_by_target_id`
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
