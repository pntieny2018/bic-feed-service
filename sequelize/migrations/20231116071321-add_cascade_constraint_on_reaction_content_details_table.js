'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'reaction_content_details';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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

  async down(queryInterface, Sequelize) {},
};
