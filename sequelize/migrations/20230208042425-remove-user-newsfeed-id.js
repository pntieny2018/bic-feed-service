'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'user_newsfeed';
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex({
          tableName: tableName,
          schema: schemaName,
        },
        `${tableName}_user_id`,
        {
          transaction: t
        }
      );

      await queryInterface.removeIndex({
        tableName: tableName,
        schema: schemaName,
      },
      `${tableName}_post_id_user_id`,
      {
        transaction: t
      }
    );

      await queryInterface.removeColumn({
            tableName,
            schema: schemaName
          },
          'id', {
            transaction: t
          }
        );
      await queryInterface.sequelize.query(`ALTER TABLE ${schemaName}.${tableName} ADD PRIMARY KEY(user_id, post_id)`, { transaction: t});
      t.commit();
    } catch (e) {
      console.log(e);
      t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};