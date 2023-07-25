'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'user_take_quiz_detail';
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
        user_take_quiz_id: {
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
        fields: ['user_take_quiz_id'],
        type: 'foreign key',
        references: {
          table: 'users_take_quizzes',
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
