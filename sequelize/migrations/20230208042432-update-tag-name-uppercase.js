'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`UPDATE ${schemaName}.tags SET name = upper(name)`);

    await queryInterface.sequelize.query(
      `
      UPDATE ${schemaName}.posts p
      SET tags_json = t2.arg_tags
      FROM (
          SELECT post_id, jsonb_agg(tags) as arg_tags
          FROM (
            SELECT 
            pt.post_id, 
            jsonb_build_object('id',t.id,'name',t.name, 'slug', t.slug, 'groupId', t.group_id, 'totalUsed',t.total_used) as tags
          FROM ${schemaName}.tags t
          INNER JOIN ${schemaName}.posts_tags pt ON t.id = pt.tag_id) tmp
          GROUP BY post_id
      ) as t2
      WHERE t2.post_id = p.id
      `
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
