require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'tags';
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'total_used',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'total_used'
    );
  },
};
