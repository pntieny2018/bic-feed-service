'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    const userIds = [5, 3, 7];
    for (let i = 0; i <= 5; i++) {
      const x = Date.now() + Math.random() * 36000000 * (Math.random() > 0.5 ? 1 : -1);
      const important_expired_at = Math.random() > 0.5 ? new Date(x) : null;
      data.push({
        created_by: userIds[Math.floor(Math.random() * userIds.length)],
        updated_by: userIds[Math.floor(Math.random() * userIds.length)],
        content: `content ${i} ...`,
        important_expired_at: important_expired_at,
        created_at: new Date(Date.now() + Math.random() * 36000000 * (Math.random() > 0.5 ? 1 : -1))
      });
    }

    return queryInterface.bulkInsert('posts', data);
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('posts', null, {});
  },
};
