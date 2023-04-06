'use strict';
const schemaName = process.env.DB_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn({ tableName: 'posts_groups', schema: schemaName }, `is_pinned`, {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn(
      { tableName: 'posts_groups', schema: schemaName },
      `pinned_index`,
      {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: 'posts_groups',
        schema: schemaName,
      },
      'is_pinned'
    );
    await queryInterface.removeColumn(
      {
        tableName: 'posts_groups',
        schema: schemaName,
      },
      'pinned_index'
    );
  },
};
