require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'tags';
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
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        group_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        updated_by: {
          type: Sequelize.UUID,
          allowNull: false,
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

  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
