'use strict';

const { max } = require("class-validator");

module.exports = {
  async up(queryInterface, sequelize) {
    let count = 1;
    const groups = [1,2,3,4,5];
    const users = [10,11,12,13,14,15,16,17,18,19,20,21,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,64,65,66,67,69,70,71,72,76,77,78,79,80,81,82,83,84,85,86,87,88,89];
    const mediaIds = [1,2,3,4,5,6,7];
    const reactionNames = ['hihi', 'haha', 'huhu', 'xd', 'kk', 'xcd', 'oo', 'qq', 'gg', 'mm', 'pp'];
    const totalPost = Math.max(1000, 5000);
    for (let i = 1; i <= totalPost/1000; i++) {
      let data = [];
      for (let k = 1; k <= 1000; k++) {
        const uid = users[Math.floor(Math.random()*users.length)];
        data.push({
          'is_draft': false,
          'content': `Content ${count}....`,
          'can_share': true,
          'can_comment': true,
          'can_react': true,
          'comments_count': 0,
          'created_by': uid,
          'updated_by': uid,
        })
        count++;
      }
      await queryInterface.bulkInsert('posts', data);
    }

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

    let postId = 1;
    for (let i = 1; i <= totalPost/1000; i++) {
      let postGroup = [];
      let mentions = [];
      let media = [];
      for (let k = 1; k <= 100; k++) {
        const groupInd = Math.floor(Math.random()*groups.length);
        postGroup.push({
          'post_id': postId,
          'group_id': groups[groupInd],
        })
        postGroup.push({
          'post_id': postId,
          'group_id': groups[groupInd+1] ?? groups[0],
        })
        postGroup.push({
          'post_id': postId,
          'group_id': groups[groupInd+2] ?? groups[1],
        })

        for(let j = 1; j<=10; j++) {
          mentions.push({
            'entity_id': postId,
            'mentionable_type': 'post',
            'user_id': j
          })
        }

        media.push({
          'post_id': postId,
          'media_id': mediaIds[Math.floor(Math.random()*mediaIds.length)],
        });
        postId++;
      }
      await queryInterface.bulkInsert('mentions', mentions);
      await queryInterface.bulkInsert('posts_groups', postGroup);
      await queryInterface.bulkInsert('posts_media', media);
    }


    let comments = [];
    for(let j = 1; j<=1000; j++) {
      const uid = users[Math.floor(Math.random()*users.length)];
      comments.push({
        'post_id': 1,
        'parent_id': 0,
        'content': 'comment aaaa.....',
        'total_reply': 0,
        'created_by': uid,
        'updated_by': uid
      })
      let chilComments = [];
      for(let k = 1; k<=10; k++) {
        chilComments.push({
          'post_id': 1,
          'parent_id': k,
          'content': 'comment aaaa.....',
          'total_reply': 0,
          'created_by': uid,
          'updated_by': uid
        })
      }
      await queryInterface.bulkInsert('comments', chilComments);
    }
    await queryInterface.bulkInsert('comments', comments);

    for( let i = 1; i<= totalPost/1000; i++) {
      let postId = 1;
      for (let k = 1; k<= 5; k++) {
        let newfeed = [];
        let reactions = [];
        for (let j = 1; j<=1000;j++) {
          newfeed.push({
            'user_id': i,
            'post_id': postId
          })
          
          for(let x = 0; x<= 6; x++) {
            reactions.push({
              'post_id': postId,
              'reaction_name': reactionNames[x] ?? 'yy',
              'created_by': i
            })
          }
          if(reactions.length === 999) {
            await queryInterface.bulkInsert('posts_reactions', reactions);
            reactions = [];
          }
          postId++;
        }
        
        await queryInterface.bulkInsert('user_newsfeed', newfeed);
      }
    }
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('posts', null, {});
  },
};
