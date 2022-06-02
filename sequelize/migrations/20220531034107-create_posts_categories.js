// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts_categories';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        post_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          onDelete: 'CASCADE',
          references: { model: 'posts', key: 'id' },
        },
        category_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          references: { model: 'categories', key: 'id' },
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
    await queryInterface.addIndex(tableName, ['post_id', 'category_id'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
