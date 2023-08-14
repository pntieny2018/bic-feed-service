'use strict';

const schemaName = process.env.DB_SCHEMA;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE ${schemaName}.quiz_participants
      SET is_highest = true
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY created_by, post_id ORDER BY score DESC, created_at DESC) AS row_number
          FROM ${schemaName}.quiz_participants
          WHERE finished_at IS NOT NULL OR started_at + time_limit * INTERVAL '1 second' <= NOW()
        ) AS t
        WHERE t.row_number = 1
      )
    `);
  },

  async down(queryInterface, Sequelize) {},
};
