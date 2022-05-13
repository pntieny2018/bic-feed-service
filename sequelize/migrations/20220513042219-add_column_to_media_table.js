require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'media';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'size',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'mime_type',
      {
        type: Sequelize.STRING(20),
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'upload_id',
      {
        type: Sequelize.UUID,
        allowNull: true,
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
        allowNull: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'size'
    );

    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'mime_type'
    );
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'upload_id'
    );
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'is_processing'
    );
    
  },
};
