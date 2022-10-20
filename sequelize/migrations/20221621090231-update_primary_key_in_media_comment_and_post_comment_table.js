// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`ALTER TABLE ${schemaName}.comments_media ADD PRIMARY KEY(comment_id, media_id);`)
    await queryInterface.sequelize.query(`ALTER TABLE ${schemaName}.posts_media ADD PRIMARY KEY(post_id, media_id);`)
  },

  down: async (queryInterface) => {
  }
};