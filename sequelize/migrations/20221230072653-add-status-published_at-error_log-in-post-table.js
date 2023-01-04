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
      'status',
      {
        type: Sequelize.ENUM('DRAFT', 'PROCESSING', 'PUBLISHED', 'WAITING_SCHEDULE', 'SCHEDULE_FAILED'),
        defaultValue: 'DRAFT',
      }
    );

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'published_at',
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'error_log',
      {
        type: Sequelize.JSONB,
        allowNull: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'status'
    );
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'published_at'
    );
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'error_log'
    );
  },
};
