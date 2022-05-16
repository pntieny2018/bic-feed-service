require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'giphy';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          type: Sequelize.STRING,
          allowNull: false,
          primaryKey: true,
        },
        type: {
          type: Sequelize.ENUM('gif', 'sticker'),
          allowNull: false,
        }
      },
      {
        schema: schemaName,
      }
    );
    await queryInterface.addIndex(tableName, ['id', 'type'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
