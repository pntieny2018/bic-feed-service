'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'posts', schema: schemaName },
      `is_reported`,
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    )

    await queryInterface.addColumn(
      { tableName: 'posts', schema: schemaName },
      `is_hidden`,
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    )
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
