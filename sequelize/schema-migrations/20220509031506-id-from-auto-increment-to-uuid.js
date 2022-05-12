'use strict';

const schemaName = process.env.DB_SCHEMA;

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    return queryInterface
      .addColumn({ tableName: `posts`, schema: schemaName }, 'uuid', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        primaryKey: false,
      }, { transaction: t })
      .then(() => {
        return queryInterface
          .addColumn({ tableName: `comments`, schema: schemaName }, 'uuid', {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            allowNull: false,
            primaryKey: false
          }, { transaction: t })
      })
      .then(() => {
        return queryInterface
          .addColumn({ tableName: `media`, schema: schemaName }, 'uuid', {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            allowNull: false,
            primaryKey: false
          }, { transaction: t })
      })
      .then(() => {
        return queryInterface
          .addColumn({ tableName: `posts_reactions`, schema: schemaName }, 'uuid', {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            allowNull: false,
            primaryKey: false
          }, { transaction: t })
      })
      .then(() => {
        return queryInterface
          .addColumn({ tableName: `comments_reactions`, schema: schemaName }, 'uuid', {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            allowNull: false,
            primaryKey: false
          }, { transaction: t })
      })
      .then(() => {
        return queryInterface
          .addColumn({ tableName: `mentions`, schema: schemaName }, 'uuid', {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            allowNull: false,
            primaryKey: false
          }, { transaction: t })
      })
      .then(() => { // add temp ref col
        return Promise.all([
          queryInterface.addColumn({ tableName: `comment_edited_history`, schema: schemaName }, 'comment_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `comments`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `comments`, schema: schemaName }, 'parent_uuid', {
            type: Sequelize.UUID,
            allowNull: true
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `comments_media`, schema: schemaName }, 'comment_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `comments_media`, schema: schemaName }, 'media_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `comments_reactions`, schema: schemaName }, 'comment_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `mentions`, schema: schemaName }, 'entity_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `post_edited_history`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `posts_groups`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `posts_media`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `posts_media`, schema: schemaName }, 'media_uuid', { 
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `posts_reactions`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `user_newsfeed`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `users_mark_read_posts`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t }),
          queryInterface.addColumn({ tableName: `users_seen_posts`, schema: schemaName }, 'post_uuid', {
            type: Sequelize.UUID,
          }, { transaction: t })
        ])
      })
      .then(() => { // update value of temp ref col
        return Promise.all([
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.comment_edited_history ceh
              SET comment_uuid=(SELECT uuid FROM ${schemaName}.comments c WHERE c.id=ceh.comment_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.comments c
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=c.post_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.comments c1
              SET parent_uuid=(SELECT uuid FROM ${schemaName}.comments c2 WHERE c2.id=c1.parent_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.comments_media cm
              SET comment_uuid=(SELECT uuid FROM ${schemaName}.comments c WHERE c.id=cm.comment_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.comments_media cm
              SET media_uuid=(SELECT uuid FROM ${schemaName}.media m WHERE m.id=cm.media_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.comments_reactions cr
              SET comment_uuid=(SELECT uuid FROM ${schemaName}.comments c WHERE c.id=cr.comment_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.mentions m
              SET entity_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=m.entity_id)
              WHERE m.mentionable_type = :mentionable_type
              `,
            {
              replacements: { mentionable_type: 'post' },
              transaction: t
            }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.mentions m
              SET entity_uuid=(SELECT uuid FROM ${schemaName}.comments c WHERE c.id=m.entity_id)
              WHERE mentionable_type = :mentionable_type
              `,
            {
              replacements: { mentionable_type: 'comment' },
              transaction: t
            }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.post_edited_history peh
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=peh.post_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.posts_groups pg
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=pg.post_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.posts_media pm
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=pm.post_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.posts_media pm
              SET media_uuid=(SELECT uuid FROM ${schemaName}.media m WHERE m.id=pm.media_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.posts_reactions pr
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=pr.post_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.user_newsfeed un
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=un.post_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.users_mark_read_posts umrp
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=umrp.post_id)
              `,
            { transaction: t }
          ),
          queryInterface.sequelize.query(
            `
              UPDATE ${schemaName}.users_seen_posts usp
              SET post_uuid=(SELECT uuid FROM ${schemaName}.posts p WHERE p.id=usp.post_id)
              `,
            { transaction: t }
          )
        ])
      })
      .then(() => { // drop fk
        return Promise.all([
          queryInterface.removeColumn({ tableName: `comment_edited_history`, schema: schemaName }, 'comment_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `comments`, schema: schemaName }, 'post_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `comments`, schema: schemaName }, 'parent_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `comments_media`, schema: schemaName }, 'comment_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `comments_media`, schema: schemaName }, 'media_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `comments_reactions`, schema: schemaName }, 'comment_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `mentions`, schema: schemaName }, 'entity_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `post_edited_history`, schema: schemaName }, 'post_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `posts_groups`, schema: schemaName }, 'post_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `posts_media`, schema: schemaName }, 'post_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `posts_media`, schema: schemaName }, 'media_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `posts_reactions`, schema: schemaName }, 'post_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `user_newsfeed`, schema: schemaName }, 'post_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `users_mark_read_posts`, schema: schemaName }, 'post_id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `users_seen_posts`, schema: schemaName }, 'post_id', { transaction: t })
        ]);
      })
      .then(() => { // drop old primary key
        return Promise.all([
          queryInterface.removeColumn({ tableName: `posts`, schema: schemaName }, 'id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `comments`, schema: schemaName }, 'id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `media`, schema: schemaName }, 'id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `posts_reactions`, schema: schemaName }, 'id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `comments_reactions`, schema: schemaName }, 'id', { transaction: t }),
          queryInterface.removeColumn({ tableName: `mentions`, schema: schemaName }, 'id', { transaction: t }),
        ]);
      })
      .then(() => { // rename temp primary key col 
        return Promise.all([
          queryInterface.renameColumn({ tableName: `posts`, schema: schemaName }, 'uuid', 'id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `comments`, schema: schemaName }, 'uuid', 'id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `media`, schema: schemaName }, 'uuid', 'id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `posts_reactions`, schema: schemaName }, 'uuid', 'id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `comments_reactions`, schema: schemaName }, 'uuid', 'id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `mentions`, schema: schemaName }, 'uuid', 'id', { transaction: t }),
        ]);
      })
      .then(() => { // add primary key constrains
        return Promise.all([
          queryInterface.addConstraint({ tableName: `posts`, schema: schemaName }, {
            fields: ['id'],
            type: 'primary key',
            transaction: t
          }),
          queryInterface.addConstraint({ tableName: `comments`, schema: schemaName }, {
            fields: ['id'],
            type: 'primary key',
            transaction: t
          }),
          queryInterface.addConstraint({ tableName: `media`, schema: schemaName }, {
            fields: ['id'],
            type: 'primary key',
            transaction: t
          }),
          queryInterface.addConstraint({ tableName: `posts_reactions`, schema: schemaName }, {
            fields: ['id'],
            type: 'primary key',
            transaction: t
          }),
          queryInterface.addConstraint({ tableName: `comments_reactions`, schema: schemaName }, {
            fields: ['id'],
            type: 'primary key',
            transaction: t
          }),
          queryInterface.addConstraint({ tableName: `mentions`, schema: schemaName }, {
            fields: ['id'],
            type: 'primary key',
            transaction: t
          })
        ]);
      })
      .then(() => { // rename temp fk key col
        return Promise.all([
          queryInterface.renameColumn({ tableName: `comment_edited_history`, schema: schemaName }, 'comment_uuid', 'comment_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `comments`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `comments`, schema: schemaName }, 'parent_uuid', 'parent_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `comments_media`, schema: schemaName }, 'comment_uuid', 'comment_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `comments_media`, schema: schemaName }, 'media_uuid', 'media_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `comments_reactions`, schema: schemaName }, 'comment_uuid', 'comment_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `mentions`, schema: schemaName }, 'entity_uuid', 'entity_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `post_edited_history`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `posts_groups`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `posts_media`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `posts_media`, schema: schemaName }, 'media_uuid', 'media_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `posts_reactions`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `user_newsfeed`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `users_mark_read_posts`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t }),
          queryInterface.renameColumn({ tableName: `users_seen_posts`, schema: schemaName }, 'post_uuid', 'post_id', { transaction: t })
        ]);
      })
      .then(() => { // add fk constraints
        return Promise.all([
          queryInterface.addConstraint({ tableName: `comments`, schema: schemaName }, {
            fields: ['post_id'],
            type: 'foreign key',
            references: {
              table: `posts`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `comments`, schema: schemaName }, `post_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `comments_media`, schema: schemaName }, {
            fields: ['comment_id'],
            type: 'foreign key',
            references: {
              table: `comments`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `comments_media`, schema: schemaName }, `comment_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `comments_media`, schema: schemaName }, {
            fields: ['media_id'],
            type: 'foreign key',
            references: {
              table: `media`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `comments_media`, schema: schemaName }, `media_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `comments_reactions`, schema: schemaName }, {
            fields: ['comment_id'],
            type: 'foreign key',
            references: {
              table: `comments`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `comments_reactions`, schema: schemaName }, `comment_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `posts_groups`, schema: schemaName }, {
            fields: ['post_id'],
            type: 'foreign key',
            references: {
              table: `posts`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `posts_groups`, schema: schemaName }, `post_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),
          
          queryInterface.addConstraint({ tableName: `posts_media`, schema: schemaName }, {
            fields: ['post_id'],
            type: 'foreign key',
            references: {
              table: `posts`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `posts_media`, schema: schemaName }, `post_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `posts_media`, schema: schemaName }, {
            fields: ['media_id'],
            type: 'foreign key',
            references: {
              table: `media`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `posts_media`, schema: schemaName }, `media_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `posts_reactions`, schema: schemaName }, {
            fields: ['post_id'],
            type: 'foreign key',
            references: {
              table: `posts`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `posts_reactions`, schema: schemaName }, `post_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `user_newsfeed`, schema: schemaName }, {
            fields: ['post_id'],
            type: 'foreign key',
            references: {
              table: `posts`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `user_newsfeed`, schema: schemaName }, `post_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `users_mark_read_posts`, schema: schemaName }, {
            fields: ['post_id'],
            type: 'foreign key',
            references: {
              table: `posts`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `users_mark_read_posts`, schema: schemaName }, `post_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t }),

          queryInterface.addConstraint({ tableName: `users_seen_posts`, schema: schemaName }, {
            fields: ['post_id'],
            type: 'foreign key',
            references: {
              table: `posts`,
              field: 'id'
            },
            transaction: t
          }),
          queryInterface.changeColumn({ tableName: `users_seen_posts`, schema: schemaName }, `post_id`, {
            type: Sequelize.UUID,
            allowNull: false
          }, { transaction: t })
        ]);
      })
      .then(() => {
        return t.commit();
      })
      .catch((e) => {
        console.log(e);
        t.rollback().catch((er) => console.log(er));
      });
  },

  async down(queryInterface, Sequelize) { }
};
