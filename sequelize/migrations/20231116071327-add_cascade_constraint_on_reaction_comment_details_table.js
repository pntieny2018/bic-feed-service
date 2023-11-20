'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'reaction_comment_details';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint(
      { tableName, schema: schemaName },
      {
        fields: ['comment_id'],
        type: 'foreign key',
        references: {
          table: 'comments',
          field: 'id',
        },
        onDelete: 'CASCADE',
      }
    );
  },

  async down(queryInterface, Sequelize) {},
};
