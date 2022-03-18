'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const data = [];
    const postNumber = 5;
    const mediaNumber = 30;
    for(let i = 0; i < 5; ++i) {
      data.push({
        post_id: Math.floor(Math.random() * 5) + 1,
        media_id: Math.floor(Math.random() * 30) + 1,
      })
    }
    return queryInterface.bulkInsert('post_media', data);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('post_media', null, {});
  }
};
