'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'quiz_questions';
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
        content: {
          type: Sequelize.UUID,
          allowNull: false,
        },
      },
      {
        schema: schemaName,
      }
    );

    await queryInterface.addConstraint(
      { tableName, schema: schemaName },
      {
        fields: ['quiz_id'],
        type: 'foreign key',
        references: {
          table: 'quizzes',
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
