require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'comments';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'edited',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
      'edited'
    );
  },
};
