'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'posts', schema: schemaName },
      `video_id_processing`,
      {
        type: Sequelize.UUID,
        allowNull: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'posts', schema: schemaName },
      `video_id_processing`
    );
  },
};
