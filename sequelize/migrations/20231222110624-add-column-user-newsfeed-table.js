'use strict';

const schemaName = process.env.DB_SCHEMA;
const tableName = 'user_newsfeed';
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        { tableName, schema: schemaName },
        `type`,
        {
          type: 'enum_posts_type',
          allowNull: false,
          defaultValue: 'POST',
        },
        {
          transaction: t,
        }
      );

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'published_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        {
          transaction: t,
        }
      );

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'created_by',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        {
          transaction: t,
        }
      );

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'is_important',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        {
          transaction: t,
        }
      );

      await t.commit();
    } catch (error) {
      console.log(error);
      await t.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {},
};
