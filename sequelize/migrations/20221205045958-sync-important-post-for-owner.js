'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `INSERT INTO ${schemaName}.users_mark_read_posts(user_id,post_id,created_at)
      SELECT created_by, id, created_at
      FROM ${schemaName}.posts p
      WHERE p.is_important = TRUE and p.is_draft = FALSE
      ON CONFLICT (user_id,post_id) DO NOTHING;`
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
