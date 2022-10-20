// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'media'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        tableName,
        schema: schemaName,
      },
      'is_draft'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.add(
      {
        tableName,
        schema: schemaName,
      },
      'is_draft',
      {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }
    );
  }
};