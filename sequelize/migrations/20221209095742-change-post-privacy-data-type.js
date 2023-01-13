'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE ${schemaName}.enum_posts_privacy RENAME VALUE 'PUBLIC' to 'CLOSED'`
    );
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
