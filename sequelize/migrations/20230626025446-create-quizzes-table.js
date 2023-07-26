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
        content_id: {
          type: Sequelize.UUID,
          defaultValue: null,
        },
        title: {
          type: Sequelize.STRING(65),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('DRAFT', 'PUBLISHED'),
          defaultValue: 'DRAFT',
        },
        description: {
          type: Sequelize.STRING(256),
          allowNull: true,
        },
        number_of_questions: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        number_of_answers: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        number_of_answers_display: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        number_of_questions_display: {
          type: Sequelize.SMALLINT,
          allowNull: false,
          defaultValue: 0,
        },
        is_random: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        questions: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        meta: {
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
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
