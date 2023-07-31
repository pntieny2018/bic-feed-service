'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'quiz_participant_answers';
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
        quiz_participant_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        question_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        answer_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        is_correct: {
          type: Sequelize.BOOLEAN,
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

    await queryInterface.addConstraint(
      { tableName, schema: schemaName },
      {
        fields: ['quiz_participant_id'],
        type: 'foreign key',
        references: {
          table: 'quiz_participants',
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
