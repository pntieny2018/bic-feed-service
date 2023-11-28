'use strict';
const schemaName = process.env.DB_SCHEMA;
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { schema: schemaName, tableName: 'reports' },
      {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
        },
        group_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        report_to: {
          type: Sequelize.DataTypes.ENUM('COMMUNITY', 'GROUP'),
          allowNull: false,
        },
        target_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        target_type: {
          type: Sequelize.DataTypes.ENUM('ARTICLE', 'POST', 'COMMENT'),
          allowNull: false,
        },
        target_actor_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        reasons_count: {
          type: Sequelize.JSONB,
          allowNull: false,
        },
        status: {
          type: Sequelize.DataTypes.ENUM('CREATED', 'IGNORED', 'HID'),
          allowNull: false,
          defaultValue: 'CREATED',
        },
        processed_by: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        processed_at: {
          type: Sequelize.DATE,
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

    await queryInterface.createTable(
      { schema: schemaName, tableName: 'report_details' },
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
          references: { model: 'reports', key: 'id' },
          onDelete: 'CASCADE',
        },
        reporter_id: {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('report_details');
    await queryInterface.dropTable('reports');
  },
};
