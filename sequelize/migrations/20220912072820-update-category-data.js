require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;
const tableName = 'categories';
module.exports = {
    async up(queryInterface, Sequelize) {

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'zindex',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        }
      );

      await queryInterface.addColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'is_active',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        }
      );

      const masterData = [
        {
          name: 'Fashion & Beauty',
          slug: 'fashion-beauty',
          level: '1',
          index: '17',
        },
        {
          name: 'Outdoors',
          slug: 'outdoors',
          level: '1',
          index: '17',
        },
        {
          name: 'Arts & Culture',
          slug: 'arts-culture',
          level: '1',
          index: '15',
        },
        {
          name: 'Animation & Comics',
          slug: 'animation-comics',
          level: '1',
          index: '14',
        },
        {
          name: 'Business & Finance',
          slug: 'business-finance',
          level: '1',
          index: '13',
        },
        {
          name: 'Food',
          slug: 'food',
          level: '1',
          index: '12',
        },
        {
          name: 'Travel',
          slug: 'travel',
          level: '1',
          index: '11',
        },
        {
          name: 'Entertainment',
          slug: 'entertainment',
          level: '1',
          index: '10',
        },
        {
          name: 'Music',
          slug: 'music',
          level: '1',
          index: '9',
        },
        {
          name: 'Gaming',
          slug: 'gaming',
          level: '1',
          index: '8',
        },
        {
          name: 'Carrers',
          slug: 'carrers',
          level: '1',
          index: '7',
        },
        {
          name: 'Family & Relationships',
          slug: 'family-relationships',
          level: '1',
          index: '6',
        },
        {
          name: 'Fitness',
          slug: 'fitness',
          level: '1',
          index: '5',
        },
        {
          name: 'Sports',
          slug: 'sports',
          level: '1',
          index: '4',
        },
        {
          name: 'Technology',
          slug: 'Technology',
          level: '1',
          index: '3',
        },
        {
          name: 'Science',
          slug: 'science',
          level: '1',
          index: '2',
        },
        {
          name: 'Others',
          slug: 'others',
          level: '1',
          index: '1',
        },
      ]

      await queryInterface.sequelize.query(`DELETE FROM ${schemaName}.posts_categories`);
      await queryInterface.sequelize.query(`DELETE FROM ${schemaName}.${tableName}`);

      const dataInsert = masterData.map((row) => {
          return `('${row.name}','${row.slug}', ${row.level}, ${row.index})`;
        })
        .join(',');
        await queryInterface.sequelize.query(
          `INSERT INTO ${schemaName}.${tableName}(name, slug, level, zindex) VALUES ${dataInsert}`,
        );

    },

    async down(queryInterface, Sequelize) {
      await queryInterface.sequelize.query(`DELETE FROM ${schemaName}.${tableName}`);
      await queryInterface.removeColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'zindex'
      );
      await queryInterface.removeColumn(
        {
          tableName: tableName,
          schema: schemaName,
        },
        'is_active'
      );
    },
};