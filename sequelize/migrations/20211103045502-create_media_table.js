// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.POSTGRES_SCHEMA;
const tableName = 'medias';

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
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        url: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM('image', 'video', 'file'),
          allowNull: false,
        },
        is_draft: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        origin_name: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        width: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        height: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        extension: {
          type: Sequelize.STRING,
          allowNull: true,
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
