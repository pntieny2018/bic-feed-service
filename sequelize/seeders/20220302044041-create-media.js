'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    for (let i = 0; i <= 10; i++) {
      data.push({
        name: `image ${i}`,
        created_by: 1,
        url: 'https://google.com',
        type: 'image',
      });
    }

    for (let i = 0; i <= 10; i++) {
      data.push({
        name: `video ${i}`,
        created_by: 1,
        url: 'https://google.com',
        type: 'video',
      });
    }

    for (let i = 0; i <= 10; i++) {
      data.push({
        name: `file ${i}`,
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
