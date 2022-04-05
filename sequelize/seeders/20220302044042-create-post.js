'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    const data = [];
    const postGroups = [];
    const postMentions = [];
    const postMedia = [];
    const comments = [];
    const reactions = [];
    const users = [59, 1];
    for (let i = 0; i <= 2000; i++) {
      for (let k = 1; k <= 1000; i++) {
        data.push({
          created_by: 1,
          updated_by: 1,
          content: `content ${k} ...`,
        });
      }
    }
    await queryInterface.bulkInsert('posts', data);
    for (let i = 0; i <= 200000; i++) {
      for (let k = 1; k <= 10; i++) {
        postGroups.push({
          post_id: k,
          group_id: Math.floor(Math.random() * 100),
        });
        for(let countMention = 1; countMention<= 10; countMention++) {
          postMentions.push({
            entity_id: k,
            user_id: users[Math.floor(Math.random()*users.length)],
            mentionable_type: 'post',
          });
        }
        postMedia.push({
          post_id: k,
          media_id: k
        });
        postMedia.push({
          post_id: k,
          media_id: k+1
        });

        for(let countCm = 1; countCm<= 100; countCm++) {
          comments.push({
            postId: i,
            created_by: i,
            updated_by: i,
            content: `Random content ${i}...`,
          });
        }
        for(let reactionCount = 1; reactionCount<= 100; reactionCount++) {
          reactions.push({
            postId: i,
            created_by: i,
            updated_by: i,
            content: `Random content ${i}...`,
          });
        }
      }
      queryInterface.bulkInsert('post_reactions', reactionCount);
      queryInterface.bulkInsert('posts_groups', postGroups);
      queryInterface.bulkInsert('mentions', postMentions);
      queryInterface.bulkInsert('posts_media', postMedia);
      queryInterface.bulkInsert('comments', comments);
    }
  },

  async down(queryInterface, sequelize) {
    await queryInterface.bulkDelete('comments', null, {});
    await queryInterface.bulkDelete('posts_media', null, {});
    await queryInterface.bulkDelete('posts_groups', null, {});
    await queryInterface.bulkDelete('mentions', null, {});
    await queryInterface.bulkDelete('posts', null, {});
  },
};

