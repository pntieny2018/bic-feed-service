import { getDatabaseConfig } from '@libs/database/postgres/config';
import { CommentReactionModel } from '@libs/database/postgres/model';
import { ReactionCommentDetailsModel } from '@libs/database/postgres/model/reaction-comment-details.model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner, Option } from 'nest-commander';

interface ICommandOptions {
  rollback: boolean;
}

@Command({
  name: 'reaction:update-comment-reaction-count',
  description: 'Update reaction count for comments',
})
export class UpdateCommentReactionCountCommand implements CommandRunner {
  private readonly _logger = new Logger(UpdateCommentReactionCountCommand.name);

  public constructor(
    @InjectModel(CommentReactionModel)
    private _commentReactionModel: typeof CommentReactionModel,
    @InjectModel(ReactionCommentDetailsModel)
    private _reactionCommentDetailsModel: typeof ReactionCommentDetailsModel
  ) {}

  @Option({
    flags: '-r, --rollback [boolean]',
  })
  public async run(params: string[], options?: ICommandOptions): Promise<any> {
    if (Boolean(options.rollback)) {
      return this.rollBack();
    }
    const databaseConfig = getDatabaseConfig();
    const schema = databaseConfig.schema;

    try {
      this._logger.log('Start update reaction count for comments');

      await this._reactionCommentDetailsModel.sequelize.query(`
        INSERT INTO ${schema}."reaction_comment_details" ("comment_id", "reaction_name", "count")
        SELECT
          "comment_id",
          "reaction_name",
          COUNT(*)
        FROM
            ${schema}."comments_reactions" AS "CommentReactionsModel"
        GROUP BY "CommentReactionsModel"."comment_id", "CommentReactionsModel"."reaction_name"
      `);

      this._logger.log('Update reaction count successfully');
    } catch (e) {
      this._logger.error(e.message);
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  public async rollBack(): Promise<any> {
    try {
      await this._reactionCommentDetailsModel.destroy({
        where: {},
        truncate: true,
      });
      this._logger.log('Rollback successfully');
      process.exit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
  }
}
