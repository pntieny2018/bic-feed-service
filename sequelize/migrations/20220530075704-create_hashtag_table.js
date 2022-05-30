require('dotenv').config();
const  { NIL: NIL_UUID } = require('uuid');

const schemaName = process.env.DB_SCHEMA;
const tableName = 'hashtags';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("gen_random_uuid()")
        },
        name: {
          type: Sequelize.STRING(5000),
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
