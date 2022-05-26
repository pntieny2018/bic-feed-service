require('dotenv').config();
const  { NIL: NIL_UUID } = require('uuid');

const schemaName = process.env.DB_SCHEMA;
const tableName = 'categories';

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
        parent_id: {
          type: Sequelize.UUID,
          allowNull: false,
          defaultValue: NIL_UUID,
        },
        name: {
          type: Sequelize.STRING(5000),
          allowNull: true,
        },
        slug: {
          type: Sequelize.STRING(5000),
          allowNull: true,
        },
        level: {
          type: Sequelize.SMALLINT,
          allowNull: false,
        },
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        updated_by: {
          type: Sequelize.INTEGER,
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

    await queryInterface.addIndex(tableName, ['created_by']);
    await queryInterface.addIndex(tableName, ['slug'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
