require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'report_contents';
const dbVersion = parseInt(process.env.DB_VER) ?? 14;
const genRandomUUID = dbVersion < 14 ? 'public.gen_random_uuid()' : 'gen_random_uuid()';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal(genRandomUUID),
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        updated_by: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        target_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        target_type: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        author_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        in: {
          type: Sequelize.JSONB,
          allowNull: false,
        },
        reason_type: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        reason: {
          type: Sequelize.STRING(512),
          allowNull: true,
        },
        status: {
          type: Sequelize.STRING(30),
          defaultValue: 'CREATED',
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        schema: schemaName,
      }
    );
    await queryInterface.addIndex(tableName, ['created_by']);
    await queryInterface.addIndex(tableName, ['updated_by']);
    await queryInterface.addIndex(tableName, ['target_id']);
    await queryInterface.addIndex(tableName, ['target_type']);
    await queryInterface.addIndex(tableName, ['author_id']);
    await queryInterface.addIndex(tableName, ['created_by', 'target_id'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
