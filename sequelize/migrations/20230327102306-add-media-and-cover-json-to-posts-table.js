'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName: 'posts', schema: schemaName }, `media_json`, {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn({ tableName: 'posts', schema: schemaName }, `cover_json`, {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn({ tableName: 'posts', schema: schemaName }, `media_json`);
    await queryInterface.removeColumn({ tableName: 'posts', schema: schemaName }, `cover_json`);
  },
};
