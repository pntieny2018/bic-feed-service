// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.POSTGRES_SCHEMA;
const tableName = 'user_newsfeed';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          autoIncrement: true,
          type: Sequelize.INTEGER,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        post_id: {
          type: Sequelize.INTEGER,
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
    await queryInterface.addIndex(tableName, ['user_id', 'post_id'], {
      name: 'user_post_index',
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex(tableName, 'user_post_index');
    await queryInterface.dropTable(tableName);
  },
};
