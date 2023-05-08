'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName: 'comments', schema: schemaName }, `media_json`, {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn({ tableName: 'comments', schema: schemaName }, `media_json`);
  },
};
