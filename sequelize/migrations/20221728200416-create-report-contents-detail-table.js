require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'report_content_details';
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
          defaultValue: Sequelize.literal('gen_random_uuid()'),
        },
        report_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'report_contents', key: 'id' },
          onDelete: 'CASCADE',
        },
        report_to: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        target_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        target_type: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        group_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        reason_type: {
          type: Sequelize.STRING(60),
          allowNull: false,
        },
        reason: {
          type: Sequelize.STRING(512),
          allowNull: true,
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

    await queryInterface.addIndex(tableName, ['report_id']);

    await queryInterface.addIndex(tableName, ['report_id', 'reason_type']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
