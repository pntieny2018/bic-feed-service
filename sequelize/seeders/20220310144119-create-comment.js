'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const data = [];
    for (let i = 0; i < 100; ++i) {
      data.push({
        post_id: i + 1,
        created_by: i,
        updated_by: i,
        content: `Random content ${i}...`,
      });
    }
    return queryInterface.bulkInsert('comments', data);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('comments', null, {});
  }
};
