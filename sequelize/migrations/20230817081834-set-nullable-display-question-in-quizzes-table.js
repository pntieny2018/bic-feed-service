'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'quizzes';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn(
      { tableName, schema: schemaName },
      `number_of_questions_display`,
      {
        type: Sequelize.SMALLINT,
        allowNull: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn(
      { tableName, schema: schemaName },
      `number_of_questions_display`,
      {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      }
    );
  },
};
