'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'quizzes';
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
        title: {
          type: Sequelize.STRING(65),
          allowNull: false,
          defaultValue: false,
        },
        description: {
          type: Sequelize.STRING(256),
          allowNull: false,
          defaultValue: false,
        },
        num_question: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        num_answer: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        num_answer_display: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        num_question_display: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        is_random: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        data: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
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
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
