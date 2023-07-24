'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'users_take_quizzes';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      tableName,
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
        },
        quiz_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        content_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },

        time_limit: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        score: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        total_questions_completed: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        started_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        finished_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        quiz_snapshot: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        updated_by: {
          type: Sequelize.UUID,
          allowNull: true,
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

    await queryInterface.addConstraint(
      { tableName, schema: schemaName },
      {
        fields: ['content_id'],
        type: 'foreign key',
        references: {
          table: 'posts',
          field: 'id',
        },
        onDelete: 'CASCADE',
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(tableName);
  },
};
