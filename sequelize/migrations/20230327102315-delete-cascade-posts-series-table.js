'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `DELETE FROM ${schemaName}.posts_series WHERE post_id NOT IN (
        SELECT id FROM ${schemaName}.posts
        )`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DELETE FROM ${schemaName}.posts_series WHERE series_id NOT IN (
        SELECT id FROM ${schemaName}.posts t2 WHERE t2.type = 'SERIES' 
        )`,
        { transaction }
      );

      await queryInterface.addConstraint(
        { tableName: `posts_series`, schema: schemaName },
        {
          fields: ['series_id'],
          type: 'foreign key',
          references: {
            table: 'posts',
            field: 'id',
          },
          onDelete: 'CASCADE',
          transaction,
        }
      );

      await queryInterface.addConstraint(
        { tableName: `posts_series`, schema: schemaName },
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
      console.log(error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {},
};
