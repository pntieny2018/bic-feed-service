'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    for (let i = 0; i <= 2000; i++) {
      for (let k = 1; k <= 1000; i++) {
        data.push({
          created_by: 1,
          url: 'https://google.com',
          type: 'image',
        });
      }
      await queryInterface.bulkInsert('media', data);
    }
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('media', null, {});
  },
};
