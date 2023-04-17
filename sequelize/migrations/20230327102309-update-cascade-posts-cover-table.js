'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE  ${schemaName}.posts DROP CONSTRAINT "posts_cover_fkey"`
      );

      await queryInterface.addConstraint(
        { tableName: `posts`, schema: schemaName },
        {
          fields: ['cover'],
          type: 'foreign key',
          references: {
            table: 'media',
            field: 'id',
          },
          onUpdate: 'CASCADE',
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
