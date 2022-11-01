'use strict';
const dbVersion = parseInt(process.env.DB_VER) ?? 14;
const genRandomUUID = dbVersion < 14 ? 'public.gen_random_uuid()' : 'gen_random_uuid()';
const schemaName = process.env.DB_SCHEMA;
const tableName = 'recent_searches';
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      await queryInterface
        .addColumn({
            tableName,
            schema: schemaName
          },
          'new_id', {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal(genRandomUUID),
            allowNull: false,
            primaryKey: true,
          }, {
            transaction: t
          }
        )

      await queryInterface
        .removeColumn({
            tableName,
            schema: schemaName
          },
          'id', {
            transaction: t
          }
        )

      await queryInterface.renameColumn({
          tableName,
          schema: schemaName
        }, 'new_id', 'id', {
          transaction: t,
        }),

        await queryInterface.addConstraint({
          tableName,
          schema: schemaName
        }, {
          fields: ['id'],
          type: 'primary key',
          transaction: t,
        }),
        t.commit();
    } catch (e) {
      t.rollback();
    }
  },

  async down(queryInterface, Sequelize) {

  }
};