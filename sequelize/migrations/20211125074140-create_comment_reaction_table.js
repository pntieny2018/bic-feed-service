// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'comments_reactions';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("public.gen_random_uuid()")
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        comment_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'comments', key: 'id' },
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
    await queryInterface.addIndex(tableName, ['comment_id', 'reaction_name', 'created_by'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
