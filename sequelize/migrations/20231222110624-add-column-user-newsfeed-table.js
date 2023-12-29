'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'user_newsfeed';
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        { tableName, schema: schemaName },
        `type`,
        {
          type: 'enum_posts_type',
          allowNull: false,
          defaultValue: 'POST',
        },
        {
          transaction: t,
        }
      );

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'published_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        {
          transaction: t,
        }
      );

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'created_by',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        {
          transaction: t,
        }
      );

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'is_important',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        {
          transaction: t,
        }
      );

      await queryInterface.sequelize.query(
        `
             DELETE FROM ${schemaName}.user_newsfeed t1
              USING ${schemaName}.posts t2
              WHERE t1.post_id = t2.id AND t2.status != 'PUBLISHED'
              `,
        {
          transaction: t,
        }
      );

      await queryInterface.sequelize.query(
        `
             update ${schemaName}.user_newsfeed t1
              set created_by = t2.created_by, published_at = t2.published_at,
                  type = t2.type,
                  is_important = t2.is_important
              FROM ${schemaName}.posts t2
          WHERE
              t2.id = t1.post_id;
              `,
        {
          transaction: t,
        }
      );
      await t.commit();
    } catch (error) {
      console.log(error);
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {},
};
