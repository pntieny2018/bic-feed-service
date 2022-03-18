'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const data = [];
    const userIds = [5, 3, 7, 10];
    for (let i = 1; i <= 10; ++i) {
      data.push({
        post_id: Math.random() * 5 + 1,
        created_by: userIds[Math.floor(Math.random() * userIds.length)],
        updated_by: userIds[Math.floor(Math.random() * userIds.length)],
        content: `Random content ${i}...`,
      });
    }
    return queryInterface.bulkInsert('comments', data);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('comments', null, {});
  }
};
