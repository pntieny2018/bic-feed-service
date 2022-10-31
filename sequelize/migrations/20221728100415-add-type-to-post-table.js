'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      { tableName: 'posts', schema: schemaName },
      `type`,
      {
        type: Sequelize.ENUM('POST', 'ARTICLE', 'SERIES'),
        allowNull: false,
        defaultValue: 'POST'
      },
    )

    await queryInterface.sequelize.query(
      `UPDATE ${schemaName}.posts SET type='ARTICLE' WHERE is_article = true 
      `
    )

    await queryInterface.sequelize.query(
      `UPDATE ${schemaName}.posts SET type='POST' WHERE is_article = false 
      `
    )

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      { tableName: 'posts', schema: schemaName },
      `type`
    )
  }
};
