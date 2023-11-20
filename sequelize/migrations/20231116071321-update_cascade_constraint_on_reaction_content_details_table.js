'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'reaction_content_details';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeConstraint(
        { tableName, schema: schemaName },
        'reaction_content_details_content_id_fkey',
        { transaction }
      );

      await queryInterface.addConstraint(
        { tableName, schema: schemaName },
        {
          fields: ['content_id'],
          type: 'foreign key',
          references: {
            table: 'posts',
            field: 'id',
          },
          onDelete: 'CASCADE',
          transaction,
        }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {},
};
