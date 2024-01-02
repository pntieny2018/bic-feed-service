import { getDatabaseConfig } from '@libs/database/postgres/config';
import { CommentModel, PostModel } from '@libs/database/postgres/model';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { QueryTypes } from 'sequelize';
import { NIL } from 'uuid';
@Command({
  name: 'fix:comment-replies-count',
  description: 'Migration data reply count and related posts',
})
export class FixCommentRepliesCountCommand implements CommandRunner {
  public constructor(
    @InjectModel(CommentModel)
    private _commentModel: typeof CommentModel,
    @InjectModel(PostModel)
    private _postModel: typeof PostModel
  ) {}

  public async run(): Promise<any> {
    try {
      const { schema } = getDatabaseConfig();
      const resultComment = await this._commentModel.sequelize.query(
        `UPDATE
	          ${schema}."comments" as "comments"
         SET "total_reply" = (
            SELECT
              count(*)
            FROM
              ${schema}."comments" as "subquery"
            WHERE
              "subquery"."parent_id" = "comments"."id")
	        WHERE
		          "parent_id" = :parentId;`,
        {
          replacements: {
            parentId: NIL,
          },
          type: QueryTypes.UPDATE,
        }
      );
      console.log(`UPDATE COMMENTS ${resultComment[1]}, ${resultComment[1]} rows affected`);

      const resultPost = await this._postModel.sequelize.query(
        `UPDATE
	           ${schema}."posts" as "posts"
          SET "comments_count" = (
            SELECT
              count(*)
            FROM
               ${schema}."comments" as "comments"
            WHERE
              "comments"."post_id" = "posts"."id");`,
        {
          type: QueryTypes.UPDATE,
        }
      );
      console.log(`UPDATE POSTS ${resultPost[1]}, ${resultPost[1]} rows affected`);
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
