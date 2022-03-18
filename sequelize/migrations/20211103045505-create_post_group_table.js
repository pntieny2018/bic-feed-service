// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.POSTGRES_SCHEMA;
const tableName = 'post_group';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        post_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'posts', key: 'id' },
        },
        group_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
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
