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

    return queryInterface.bulkInsert('post_group', data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('post_group', null, {});
  }
};
