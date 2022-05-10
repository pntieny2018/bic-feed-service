// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'follows';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex(tableName, ['user_id', 'group_id'], {
      indexName: 'user_group_index',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(tableName, 'user_group_index');
  },
};
