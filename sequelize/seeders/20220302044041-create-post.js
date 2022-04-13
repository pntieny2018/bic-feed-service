'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    let count = 1;
    const groups = [1,2,3,4,5];
    const users = [10,11,12,13,14,15,16];
    const reactionNames = ['hihi', 'haha', 'huhu', 'xd', 'kk', 'xcd', 'oo', 'qq', 'gg', 'mm', 'pp'];
    for (let i = 1; i <= 4000; i++) {
      let data = [];
      for (let k = 1; k <= 1000; k++) {
        data.push({
          'is_draft': false,
          'content': `Content ${count}....`,
          'can_share': true,
          'can_comment': true,
          'can_react': true,
          'comments_count': 0,
          'created_by': users[Math.floor(Math.random()*users.length)],
          'updated_by': users[Math.floor(Math.random()*users.length)],
        })
        count++;
      }
      await queryInterface.bulkInsert('posts', data);
    }

    for (let i = 1; i <= 1000; i++) {
      let data = [];
      for (let k = 1; k <= 1000; k++) {
        data.push({
          'url': `http://google.com/....`,
          'type': 'image',
          'is_draft': false,
          'name': 'Filename.jpg',
          'origin_name': 'Filename.jpg',
          'created_by': users[Math.floor(Math.random()*users.length)],
        })
      }
      await queryInterface.bulkInsert('media', data);
    }

    let postId = 1;
    for (let i = 1; i <= 40000; i++) {
      let postGroup = [];
      let mentions = [];
      let reactions = [];
      let media = [];
      for (let k = 1; k <= 100; k++) {
        postGroup.push({
          'post_id': postId,
          'group_id': groups[Math.floor(Math.random()*groups.length)],
        })
        postGroup.push({
          'post_id': postId,
          'group_id': groups[Math.floor(Math.random()*groups.length)],
        })

        for(let j = 1; j<=10; j++) {
          mentions.push({
            'entity_id': postId,
            'mentionable_type': 'post',
            'user_id': users[Math.floor(Math.random()*users.length)]
          })
        }

        for(let j = 1; j<=50; j++) {
          reactions.push({
            'post_id': postId,
            'mention_name': reactionNames[Math.floor(Math.random()*reactionNames.length)],
            'created_by': users[Math.floor(Math.random()*users.length)]
          })
        }
        await queryInterface.bulkInsert('posts_reactions', mentions);

        for(let j = 1; j<=500; j++) {
          reactions.push({
            'post_id': postId,
            'mention_name': reactionNames[Math.floor(Math.random()*reactionNames.length)],
            'created_by': users[Math.floor(Math.random()*users.length)]
          })
        }
        postId++;
      }
      await queryInterface.bulkInsert('mentions', mentions);
      await queryInterface.bulkInsert('posts_groups', data);
    }
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('posts', null, {});
  },
};
