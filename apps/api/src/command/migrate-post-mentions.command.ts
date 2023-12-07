import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { PostModel } from '../database/models/post.model';
import { getDatabaseConfig } from '@libs/database/postgres/config';

//npx ts-node -r tsconfig-paths/register src/command/cli.ts migrate:post-mentions
//node dist/src/command/cli.js es:post-mentions
@Command({
  name: 'migrate:post-mentions',
  description: 'Migration data mention of post from old table',
})
export class MigratePostMentionsCommand implements CommandRunner {
  public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}

  public async run(): Promise<any> {
    try {
      const { schema } = getDatabaseConfig();
      const results = await this._postModel.sequelize.query(
        `UPDATE 
            ${schema}."posts"
          SET
            "mentions" = "subquery"."mentionsJson"
          FROM 
          (
	          SELECT "entity_id", array_to_json(array_agg("user_id")) AS "mentionsJson"
	          FROM ${schema}."mentions"
	          WHERE "mentionable_type" = 'post'
	          GROUP BY "entity_id" 
          ) AS "subquery"
          WHERE "id" = "subquery"."entity_id";`,
        {
          type: QueryTypes.UPDATE,
        }
      );
      console.log(`UPDATE ${results[1]}, ${results[1]} rows affected`);

      const setDefaultValueQuery = await this._postModel.sequelize.query(
        `UPDATE 
            ${schema}."posts"
          SET
	          "mentions" = '[]'
          WHERE	"mentions" IS NULL;`,
        {
          type: QueryTypes.UPDATE,
        }
      );
      console.log(
        `UPDATE DEFAULT VALUE ${setDefaultValueQuery[1]}, ${setDefaultValueQuery[1]} rows affected`
      );
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
