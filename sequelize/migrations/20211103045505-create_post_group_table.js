// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts_groups';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        post_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          references: { model: 'posts', key: 'id' },
        },
        group_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
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
    await queryInterface.addIndex(tableName, ['group_id', 'post_id'], {
      unique: true,
    });
    await queryInterface.addIndex(tableName, ['group_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
