'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'report_content_details';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex(
      {
        tableName: tableName,
        schema: schemaName,
      },
      ['target_id', 'group_id', 'created_by'],
      {
        unique: true,
      }
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
