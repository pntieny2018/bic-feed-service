'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const data = [];
    const postNumber = 5;
    const userIds = [10, 3, 5, 6];
    for(let i = 0; i < 10; ++i) {
      data.push({
        mentionable_type: 'post',
        entity_id: Math.floor(Math.random() * postNumber) + 1,
        user_id: userIds[Math.floor(Math.random() * userIds.length)]
      })
    }
    return queryInterface.bulkInsert('mentions', data);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('mentions', null, {});
  }
};
