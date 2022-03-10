// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('posts');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('posts');
  },
};
