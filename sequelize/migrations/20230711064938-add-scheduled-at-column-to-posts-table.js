'use strict';

/** @type {import('sequelize-cli').Migration} */
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    await queryInterface.addColumn({ tableName: 'posts', schema: schemaName }, `scheduled_at`, {
      type: Sequelize.DATE,
      allowNull: true,
      before: 'published_at'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    await queryInterface.removeColumn({ tableName: 'posts', schema: schemaName }, `scheduled_at`);
  }
};
