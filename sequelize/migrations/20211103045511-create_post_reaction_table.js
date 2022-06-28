// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const tableName = 'posts_reactions';
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
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        post_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'posts', key: 'id' },
        },
        reaction_name: {
          type: Sequelize.STRING(50),
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

    await queryInterface.addIndex(tableName, ['post_id', 'reaction_name', 'created_by'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
