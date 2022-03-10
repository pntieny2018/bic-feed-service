// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.POSTGRES_SCHEMA;
const tableName = 'user_newsfeed';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        post_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'posts', key: 'id' },
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
