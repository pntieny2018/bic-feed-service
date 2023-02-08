'use strict';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'follows';
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
    await queryInterface.removeIndex({
        tableName: tableName,
        schema: schemaName,
      },
      `${tableName}_user_id_group_id`,
      {
        transaction: t
      }
    );

    await queryInterface.renameColumn({
          tableName,
          schema: schemaName
        },
        'id',
        'zindex', 
        {
          transaction: t
        }
      );
      await queryInterface.sequelize.query(`ALTER TABLE ${schemaName}.${tableName} DROP CONSTRAINT follows_pkey`, { transaction: t})
      await queryInterface.sequelize.query(`ALTER TABLE ${schemaName}.${tableName} ADD PRIMARY KEY(user_id, group_id)`, { transaction: t})
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