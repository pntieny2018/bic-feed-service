'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE  ${schemaName}.users_seen_posts DROP CONSTRAINT "${schemaName}.users_seen_posts_post_id_posts_fk"`,
        { transaction }
      );
      await queryInterface.addConstraint(
        { tableName: `users_seen_posts`, schema: schemaName },
        {
          fields: ['post_id'],
          type: 'foreign key',
          references: {
            table: 'posts',
            field: 'id',
          },
          onDelete: 'CASCADE',
          transaction,
        }
      );

      return transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {},
};
