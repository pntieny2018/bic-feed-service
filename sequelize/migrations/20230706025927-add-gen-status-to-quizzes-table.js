'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName: 'quizzes', schema: schemaName }, `gen_status`, {
      type: Sequelize.ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn({ tableName: 'quizzes', schema: schemaName }, `gen_status`);
  },
};
