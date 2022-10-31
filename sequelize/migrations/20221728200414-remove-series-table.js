'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM  ${schemaName}.posts_series
      `)

    await queryInterface.sequelize.query(
      `ALTER TABLE  ${schemaName}.posts_series DROP CONSTRAINT posts_series_post_id_fkey 
      `
    )

    await queryInterface.sequelize.query(
      `ALTER TABLE  ${schemaName}.posts_series DROP CONSTRAINT posts_series_series_id_fkey 
      `
    )

    await queryInterface.dropTable('series')
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
