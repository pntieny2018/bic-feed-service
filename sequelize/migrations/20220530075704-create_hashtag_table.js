require('dotenv').config();
const  { NIL: NIL_UUID } = require('uuid');

const schemaName = process.env.DB_SCHEMA;
const tableName = 'hashtags';
const dbVersion = parseInt(process.env.DB_VER) ?? 14;
const genRandomUUID = dbVersion < 14 ? 'public.gen_random_uuid()' : 'gen_random_uuid()';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal(genRandomUUID)
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
