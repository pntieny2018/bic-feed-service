'use strict';
const schemaName = process.env.DB_SCHEMA;
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const unusedTables = [
      'comments_media',
      'posts_media',
      'comment_edited_history',
      'post_edited_history',
    ];

    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const unusedTableName of unusedTables) {
        await queryInterface.dropTable({ schema: schemaName, tableName: unusedTableName }, { transaction });
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },
};
