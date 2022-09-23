// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'link_preview';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      { tableName, schema: schemaName },
      `url`,
      {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
    )
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'url',
      {
        type: Sequelize.STRING(255),
        allowNull: true,
      }
    );
  },
};
