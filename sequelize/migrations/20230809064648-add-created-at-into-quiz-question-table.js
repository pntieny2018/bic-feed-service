'use strict';

const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'quiz_questions', schema: schemaName },
      `created_at`,
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    );

    await queryInterface.addColumn(
      { tableName: 'quiz_questions', schema: schemaName },
      `updated_at`,
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'quiz_questions', schema: schemaName },
      `created_at`
    );

    await queryInterface.removeColumn(
      { tableName: 'quiz_questions', schema: schemaName },
      `updated_at`
    );
  },
};
