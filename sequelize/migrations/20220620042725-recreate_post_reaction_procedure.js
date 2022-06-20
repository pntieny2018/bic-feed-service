// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const tableName = 'posts_reactions';
const procedureName = 'create_post_reaction';
const schemaName = process.env.DB_SCHEMA;
const dbVersion = parseInt(process.env.DB_VER) ?? 14;
const genRandomUUID = dbVersion < 14 ? 'public.gen_random_uuid()' : 'gen_random_uuid()';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `SET SEARCH_PATH = ${schemaName}; DROP PROCEDURE ${procedureName}`,
        {
          transaction,
        }
      );
      await queryInterface.sequelize.query(
        `
          
          SET SEARCH_PATH = ${schemaName};
          CREATE OR REPLACE PROCEDURE ${procedureName}(
              cpr_post_id  IN UUID,
              cpr_created_by IN INTEGER,
              cpr_reaction_name IN VARCHAR(100),
              cpr_id INOUT UUID
          )
          LANGUAGE plpgsql    
          AS $$
          DECLARE
                MAXIMUM_KIND_REACTION INTEGER := 20;
                CAN_REACT INTEGER := 0;
          BEGIN 
              -- Check maximum 21 kind reaction
              SELECT CASE 
              WHEN count(*) <= MAXIMUM_KIND_REACTION 
              THEN 1 ELSE 0 END INTO CAN_REACT
              FROM (
              SELECT ${schemaName}.${tableName}.reaction_name
                      FROM ${schemaName}.${tableName}
                      WHERE  ${schemaName}.${tableName}.post_id = cpr_post_id
                      AND  ${schemaName}.${tableName}.reaction_name <> cpr_reaction_name
                      GROUP BY  ${schemaName}.${tableName}.reaction_name
                  ) as FLAG;
              
              IF CAN_REACT = 0 THEN
                RAISE  'app.reaction.rate_limit.kind.app_error';
              END IF;
              
              INSERT INTO ${schemaName}.${tableName}(id,created_by,post_id,reaction_name,created_at)
              VALUES (${genRandomUUID},cpr_created_by,cpr_post_id,cpr_reaction_name,CURRENT_TIMESTAMP)
              RETURNING id into cpr_id;
          END;$$
    `,
        {
          transaction,
        }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
        SET SEARCH_PATH = ${schemaName};
        DROP PROCEDURE IF EXISTS ${procedureName};
    `);
  },
};
