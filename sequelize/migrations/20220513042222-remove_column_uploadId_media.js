require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'media';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'upload_id'
    );

  },

  async down(queryInterface, Sequelize) {
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
    
  },
};
