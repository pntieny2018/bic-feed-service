'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    for (let i = 0; i <= 100; i++) {
      data.push({
        created_by: 1,
        updated_by: 1,
        content: `content ${i} ...`,
      });
    }

    return queryInterface.bulkInsert('posts', data);
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('posts', null, {});
  },
};
