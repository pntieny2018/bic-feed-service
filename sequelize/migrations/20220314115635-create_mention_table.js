// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const tableName = 'mentions';
const schemaName = process.env.DB_SCHEMA;
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
          defaultValue: Sequelize.literal(genRandomUUID),
        },
        mentionable_type: {
          type: Sequelize.ENUM,
          values: ['post', 'comment'],
          allowNull: false,
        },
        entity_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },
      {
        schema: schemaName,
      }
    );
    await queryInterface.addIndex(tableName, ['mentionable_type']);
    await queryInterface.addIndex(tableName, ['entity_id']);
    await queryInterface.addIndex(tableName, ['mentionable_type', 'entity_id', 'user_id'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
