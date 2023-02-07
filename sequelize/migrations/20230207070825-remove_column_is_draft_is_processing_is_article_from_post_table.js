'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts';
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn({
          tableName: tableName,
          schema: schemaName,
        },
        'is_draft'
      );
      await queryInterface.removeColumn({
          tableName: tableName,
          schema: schemaName,
        },
        'is_processing'
      );
      await queryInterface.removeColumn({
          tableName: tableName,
          schema: schemaName,
        },
        'is_article'
      );
    } catch (e) {}
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'is_draft',
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
      'is_processing',
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
      'is_article',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    );
  }
};
