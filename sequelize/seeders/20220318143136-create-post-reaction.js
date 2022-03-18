'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const reactionType = ['smile', 'angry', 'care'];
    const postNum = 5;
    const data = [];
    const userIds = [33, 10, 4, 2, 5];
    for (let i = 0; i < 6; ++i) {
      data.push({
        created_by: userIds[Math.floor(Math.random() * userIds.length)],
        post_id: Math.floor(Math.random() * postNum) + 1,
        reaction_name: reactionType[Math.floor(Math.random() * reactionType.length)]
      })
    }
    return queryInterface.bulkInsert('post_reaction', data);

  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('post_reaction', null, {});
     
  }
};
