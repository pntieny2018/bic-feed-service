// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'comments_media';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        comment_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          references: { model: 'comments', key: 'id' },
        },
        media_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          references: { model: 'media', key: 'id' },
        },
      },
      {
        schema: schemaName,
      }
    );
    await queryInterface.addIndex(tableName, ['media_id', 'comment_id'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
