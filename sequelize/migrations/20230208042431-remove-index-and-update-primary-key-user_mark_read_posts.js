'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'users_mark_read_posts';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex({
        tableName: tableName,
        schema: schemaName,
      },
      `${tableName}_user_id_post_id`
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};