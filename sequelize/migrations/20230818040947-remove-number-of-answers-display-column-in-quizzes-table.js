'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'quizzes';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName, schema: schemaName },
      `number_of_answers_display`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName, schema: schemaName }, `number_of_answers_display`, {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    });
  },
};
