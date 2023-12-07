'use strict';
const schemaName = process.env.DB_SCHEMA;
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: 'posts_groups',
        schema: schemaName,
      },
      `is_hidden`,
      {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: 'posts_groups',
        schema: schemaName,
      },
      `is_hidden`
    );
  },
};
