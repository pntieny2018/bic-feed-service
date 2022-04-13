'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    for (let i = 1; i <= 4000; i++) {
      for (let k = 1; k <= 1000; k++) {

      }
    }

    await queryInterface.bulkInsert('media', data);
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('media', null, {});
  },
};
