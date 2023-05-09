'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE  ${schemaName}.comments_reactions DROP CONSTRAINT "${schemaName}.comments_reactions_comment_id_comments_fk"`,
        { transaction }
      );
      await queryInterface.addConstraint(
        { tableName: `comments_reactions`, schema: schemaName },
        {
          fields: ['comment_id'],
          type: 'foreign key',
          references: {
            table: 'comments',
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
