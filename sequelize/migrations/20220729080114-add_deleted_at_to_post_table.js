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
      'deleted_at',
      {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'deleted_at'
    );
  },
};
