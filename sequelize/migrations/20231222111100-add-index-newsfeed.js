'use strict';
const schemaName = process.env.DB_SCHEMA;

const indexList = [
  {
    tableName: 'posts',
    indexName: 'posts_composite_index',
    index: [
      'is_hidden',
      'deleted_at',
      'status',
      'published_at',
      'type',
      'is_important',
      'created_at',
      'created_by',
    ],
  },
  {
    tableName: 'user_newsfeed',
    indexName: 'user_newsfeed_composite_index',
    index: ['user_id', 'published_at', 'type', 'is_important'],
  },
  {
    tableName: 'posts_groups',
    indexName: 'posts_groups_composite_index',
    index: ['group_id', 'post_id', 'is_archived', 'is_hidden'],
  },
  {
    tableName: 'posts_series',
    indexName: 'posts_series_composite_index',
    index: ['series_id', 'post_id', 'zindex'],
  },
  {
    tableName: 'report_details',
    index: ['target_id'],
  },
  {
    tableName: 'report_details',
    index: ['reporter_id'],
  },
  {
    tableName: 'quiz_participants',
    indexName: 'quiz_participants_composite_index',
    index: ['post_id', 'created_by', 'created_at', 'is_highest', 'finished_at'],
  },
  {
    tableName: 'comments',
    indexName: 'comments_composite_index',
    index: ['post_id', 'parent_id', 'created_at', 'is_hidden'],
  },
  {
    tableName: 'users_seen_posts',
    indexName: 'users_seen_posts_composite_index',
    index: ['post_id', 'user_id', 'created_at'],
  },
  {
    tableName: 'users_save_posts',
    indexName: 'users_save_posts_composite_index',
    index: ['post_id', 'user_id', 'created_at'],
  },
  {
    tableName: 'user_newsfeed',
    indexName: 'user_newsfeed_post_id_index',
    index: ['post_id'],
  },
  {
    tableName: 'quizzes',
    indexName: 'quizzes_composite_index',
    index: ['post_id', 'created_by', 'status', 'created_at'],
  },
  {
    tableName: 'posts_reactions',
    indexName: 'posts_reactions_composite_index',
    index: ['post_id', 'created_by', 'reaction_name'],
    isUnique: true,
  },
  {
    tableName: 'comments_reactions',
    indexName: 'comments_reactions_composite_index',
    index: ['comment_id', 'created_by', 'reaction_name'],
    isUnique: true,
  },
  {
    tableName: 'comments',
    indexName: 'comments_parent_id_index',
    index: ['parent_id'],
  },
];
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS posts_created_by`, {
        transaction: t,
      });

      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS posts_privacy`, {
        transaction: t,
      });

      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS posts_reactions_post_id_reaction_name_created_by`,
        {
          transaction: t,
        }
      );

      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS comments_reactions_comment_id_reaction_name_created_by`,
        {
          transaction: t,
        }
      );

      for (let i = 0; i < indexList.length; i++) {
        await queryInterface.addIndex(
          {
            tableName: indexList[i].tableName,
            schema: schemaName,
          },
          indexList[i].index,
          {
            unique: indexList[i].isUnique || false,
            name: indexList[i].indexName || undefined,
            transaction: t,
          }
        );
      }

      await t.commit();
    } catch (error) {
      console.log(error);
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {},
};
