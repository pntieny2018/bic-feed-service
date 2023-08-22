'use strict';

const schemaName = process.env.DB_SCHEMA;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'quiz_participants', schema: schemaName },
      `is_highest`,
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'quiz_participants', schema: schemaName },
      `is_highest`
    );
  },
};
