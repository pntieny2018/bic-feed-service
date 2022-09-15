require('dotenv').config();
const  { NIL: NIL_UUID } = require('uuid');

const schemaName = process.env.DB_SCHEMA;
const tableName = 'categories';
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
        parent_id: {
          type: Sequelize.UUID,
          allowNull: false,
          defaultValue: NIL_UUID,
        },
        name: {
          type: Sequelize.STRING(5000),
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(5000),
          allowNull: false,
        },
        level: {
          type: Sequelize.SMALLINT,
          allowNull: false,
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        updated_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        schema: schemaName,
      }
    );

    await queryInterface.addIndex(tableName, ['created_by']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
