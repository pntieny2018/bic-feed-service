'use strict';
module.exports = {
  async up(queryInterface, sequelize) {
    let count = 1;
    const groups = [1,2,3,4,5];
    const users = [10,11,12,13,14,15,16,17,18,19,20,21,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,64,65,66,67,69,70,71,72,76,77,78,79,80,81,82,83,84,85,86,87,88,89];
    const mediaIds = [1,2,3,4,5,6,7];
    const reactionNames = ['hihi', 'haha', 'huhu', 'xd', 'kk', 'xcd', 'oo', 'qq', 'gg', 'mm', 'pp'];
    for(let p = 1001; p<= 5000; p++) {
    let comments = [];
    let commentId = 1;
      for(let c = 1; c<=1000; c++) {
        const uid = users[Math.floor(Math.random()*users.length)];
        comments.push({
          'post_id': p,
          'parent_id': 0,
          'content': 'comment aaaa.....',
          'total_reply': 0,
          'created_by': uid,
          'updated_by': uid
        })
        let chilComments = [];
        for(let k = 1; k<=50; k++) {
          chilComments.push({
            'post_id': p,
            'parent_id': commentId,
            'content': 'comment aaaa.....',
            'total_reply': 0,
            'created_by': uid,
            'updated_by': uid
          })
        }
        await queryInterface.bulkInsert('comments', chilComments);
        commentId++;
      }

      await queryInterface.bulkInsert('comments', comments); 
    }

    commentId = 1;
    for(let c = 1; c<=5000; c++) {
      let media = [];
      for (let c1 = 1; c1 <=1000; c1++) {
        let mentions = [];
        
          for(let m = 1; m<=10; m++) {
            mentions.push({
              'entity_id': commentId,
              'mentionable_type': 'comment',
              'user_id': m
            })
          }
          await queryInterface.bulkInsert('mentions', mentions);
          media.push({
            'comment_id': commentId,
            'media_id': mediaIds[Math.floor(Math.random()*mediaIds.length)],
          });
          commentId++;
      }
      console.log('media=', media);
      await queryInterface.bulkInsert('comments_media', media);
    }   
        
  },

  async down(queryInterface, sequelize) {
    return queryInterface.bulkDelete('comments', null, {});
  },
};
