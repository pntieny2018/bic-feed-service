'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'user_newsfeed';
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
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

  async down(queryInterface, Sequelize) { },
};
