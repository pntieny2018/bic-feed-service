'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const data = [];
    for (let i = 0; i <= 100; i++) {
      data.push({
        post_id: i + 1,
        group_id: Math.floor(Math.random() * 100),
      });
    }

    return queryInterface.bulkInsert('posts_groups', data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('posts_groups', null, {});
  }
};
