'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = 33;
    const data = [];
    for (let i = 1; i <= 5; ++i) {
      data.push({
        user_id: userId,
        post_id: i
      })
    }
    return queryInterface.bulkInsert('user_newsfeed', data);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('user_newsfeed', null, {});
  }
};
