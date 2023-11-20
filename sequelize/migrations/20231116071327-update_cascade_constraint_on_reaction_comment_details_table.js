'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'reaction_comment_details';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeConstraint(
        { tableName, schema: schemaName },
        'reaction_comment_details_comment_id_fkey',
        { transaction }
      );

      await queryInterface.addConstraint(
        { tableName, schema: schemaName },
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

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {},
};
