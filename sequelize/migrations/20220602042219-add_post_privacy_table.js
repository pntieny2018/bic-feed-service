require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'privacy',
      {
        type: Sequelize.ENUM('PUBLIC', 'OPEN', 'PRIVATE', 'SECRET'),
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'hashtags_json',
      {
        type: Sequelize.JSONB,
        allowNull: true,
      }
    );
    await queryInterface.addIndex(tableName, ['privacy']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'privacy'
    );

    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'hashtags'
    );
  },
};
