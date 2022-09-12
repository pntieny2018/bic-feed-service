require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'categories';
module.exports = {
    async up(queryInterface, Sequelize) {
      const masterData = [{
          name: 'Business & Finance',
          slug: 'business-finance',
          level: '1'
        },
        {
          name: 'Food',
          slug: 'food',
          level: '1'
        },
        {
          name: 'Fashion & Beauty',
          slug: 'fashion-beauty',
          level: '1'
        },
        {
          name: 'Travel',
          slug: 'travel',
          level: '1'
        },
        {
          name: 'Gaming',
          slug: 'gaming',
          level: '1'
        },
        {
          name: 'Animations & Comics',
          slug: 'animations-comics',
          level: '1'
        },
        {
          name: 'Entertainment',
          slug: 'entertainment',
          level: '1'
        },
        {
          name: 'Music',
          slug: 'music',
          level: '1'
        },
        {
          name: 'Outdoors',
          slug: 'outdoors',
          level: '1'
        },
      ]
      const dataInsert = masterData.map((row) => {
          return `('${row.name}','${row.slug}', ${row.level})`;
        })
        .join(',');

        await queryInterface.sequelize.query(
          `INSERT INTO ${schemaName}.${tableName}(name, slug, level) VALUES ${dataInsert}`,
        );

    },

    async down(queryInterface, Sequelize) {
      await queryInterface.Sequelize.query(`DELETE FROM ${schemaName}.${tableName}`)
    },
};