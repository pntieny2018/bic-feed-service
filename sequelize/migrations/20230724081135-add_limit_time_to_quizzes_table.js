'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName: 'quizzes', schema: schemaName }, `time_limit`, {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1800,
      before: 'content_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn({ tableName: 'quizzes', schema: schemaName }, `time_limit`);
  },
};
