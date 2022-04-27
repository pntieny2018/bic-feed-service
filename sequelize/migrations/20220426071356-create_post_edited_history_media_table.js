'use strict';

const schemaName = process.env.POSTGRES_SCHEMA;
const tableName = 'post_edited_history_media';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable(
      tableName,
      {
        post_edited_history_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'post_edited_history', key: 'id' },
        },
        media_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'media', key: 'id' },
        }
      },
      {
        schemaName: schemaName
      }
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable(tableName);
  }
};
