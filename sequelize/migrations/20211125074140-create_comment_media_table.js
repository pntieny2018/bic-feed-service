// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.POSTGRES_SCHEMA;
const tableName = 'comments_medias';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        comment_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'comments', key: 'id' },
        },
        media_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'media', key: 'id' },
        },
      },
      {
        schema: schemaName,
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
