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
      'tags_json',
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
      'tags_json'
    );
  },
};
