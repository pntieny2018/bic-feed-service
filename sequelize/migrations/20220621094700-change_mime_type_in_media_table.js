// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'media';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      { tableName, schema: schemaName },
      `mime_type`,
      {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
    )
  },

  down: async (queryInterface) => {
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'mime_type',
      {
        type: Sequelize.STRING(20),
        allowNull: true,
      }
    );
  },
};
