'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName: 'quizzes', schema: schemaName }, `error`, {
      type: Sequelize.JSONB(),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn({ tableName: 'quizzes', schema: schemaName }, `error`);
  },
};
