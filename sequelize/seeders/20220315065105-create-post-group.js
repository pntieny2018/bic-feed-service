'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const groupId = [1, 2, 9];
    const data = [];
    for (let i = 1; i <= 5; i++) {
      data.push({
        post_id: i,
        group_id: groupId[Math.floor(Math.random() * groupId.length)],
      });
    }

    return queryInterface.bulkInsert('post_group', data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('post_group', null, {});
  }
};
