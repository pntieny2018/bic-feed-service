// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'media';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("gen_random_uuid()")
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
