require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'report_contents';
const dbVersion = parseInt(process.env.DB_VER) ?? 14;
const genRandomUUID = dbVersion < 14 ? 'public.gen_random_uuid()' : 'gen_random_uuid()';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        tableName: tableName,
        schema: schemaName,
      },
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
        group_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        report_to: {
          type: Sequelize.STRING(30),
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
      }
    );
    await queryInterface.addIndex(tableName, ['created_by', 'group_id']);
    await queryInterface.addIndex(tableName, ['target_id']);
    await queryInterface.addIndex(tableName, ['target_type']);
    await queryInterface.addIndex(tableName, ['created_by', 'target_id'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
