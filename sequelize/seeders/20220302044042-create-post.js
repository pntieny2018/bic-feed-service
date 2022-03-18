'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    for (let i = 0; i <= 100; i++) {
      data.push({
        created_by: i,
        updated_by: i,
        content: `content ${i} ...`,
      });
    }

    return queryInterface.bulkInsert('posts', data);
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('posts', null, {});
  },
};
