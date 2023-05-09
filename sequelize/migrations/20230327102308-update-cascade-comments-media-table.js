'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE  ${schemaName}.comments_media DROP CONSTRAINT "${schemaName}.comments_media_media_id_media_fk"`,
        { transaction }
      );
      await queryInterface.addConstraint(
        { tableName: `comments_media`, schema: schemaName },
        {
          fields: ['media_id'],
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
