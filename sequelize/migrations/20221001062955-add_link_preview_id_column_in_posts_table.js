// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'posts';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        { tableName, schema: schemaName },
        `link_preview_id`,
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction: t }
      )

      await queryInterface.sequelize.query(
        `
          UPDATE ${schemaName}.${tableName} p
          SET p.link_preview_id=(SELECT link_preview_id FROM ${schemaName}.posts_link_preview plp WHERE plp.post_id=p.id)
          `,
          { transaction: t }
      )
      await queryInterface.dropTable('posts_link_preview', { transaction: t })
      t.commit();
    } catch (e) {
      console.log(e);
      t.rollback();
      throw e;
    }
    
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schemaName,
      },
      'link_preview_id'
    );
  },
};
