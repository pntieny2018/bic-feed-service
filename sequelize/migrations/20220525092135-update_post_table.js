'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'is_article',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    );
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'title',
      {
        type: Sequelize.STRING(500)
      }
    );

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'summary',
      {
        type: Sequelize.STRING(5000)
      }
    );

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'views',
      {
        type: Sequelize.INTEGER,
        defaultValue: 0
      }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'is_article'
    );
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'title'
    );
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'summary'
    );
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'views'
    );
  }
};
