'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    for (let i = 0; i <= 10; i++) {
      data.push({
        name: `x${i}.png`,
        created_by: 1,
        url: 'https://google.com',
        type: 'image',
      });
    }

    for (let i = 0; i <= 10; i++) {
      data.push({
        name: `x${i}.mp4`,
        created_by: 1,
        url: 'https://google.com',
        type: 'video',
      });
    }

    for (let i = 0; i <= 10; i++) {
      data.push({
        name: `x${i}.pdf`,
        created_by: 1,
        url: 'https://google.com',
        type: 'file',
      });
    }

    return queryInterface.bulkInsert('media', data);
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('media', null, {});
  },
};
