import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { CommentModel } from '../database/models/comment.model';
import { getDatabaseConfig } from '@libs/database/postgres/config';

//npx ts-node -r tsconfig-paths/register src/command/cli.ts migrate:comment-mentions
@Command({
  name: 'migrate:comment-mentions',
  description: 'Migration data mention of comment from old table',
})
export class MigrateCommentMentionsCommand implements CommandRunner {
  public constructor(@InjectModel(CommentModel) private _commentModel: typeof CommentModel) {}

  public async run(): Promise<any> {
    try {
      const { schema } = getDatabaseConfig();
      const results = await this._commentModel.sequelize.query(
        `UPDATE 
            ${schema}."comments"
          SET
            "mentions" = "subquery"."mentionsJson"
          FROM 
          (
	          SELECT "entity_id", array_to_json(array_agg("user_id")) AS "mentionsJson"
	          FROM ${schema}."mentions"
	          WHERE "mentionable_type" = 'comment'
	          GROUP BY "entity_id" 
          ) AS "subquery"
          WHERE "id" = "subquery"."entity_id";`,
        {
          type: QueryTypes.UPDATE,
        }
      );
      console.log(`UPDATE ${results[1]}, ${results[1]} rows affected`);

      const setDefaultValueQuery = await this._commentModel.sequelize.query(
        `UPDATE 
            ${schema}."comments"
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
