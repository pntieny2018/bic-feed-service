import { CommentReactionModel } from '@libs/database/postgres/model';
import { ReactionCommentDetailsModel } from '@libs/database/postgres/model/reaction-comment-details.model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner, Option } from 'nest-commander';
import { Sequelize } from 'sequelize-typescript';

import { getDatabaseConfig } from '../config/database';

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
      const commentReactions = await this._commentReactionModel.findAll({
        attributes: [
          'commentId',
          'reactionName',
          [this._commentReactionModel.sequelize.fn('COUNT', Sequelize.col('*')), 'count'],
        ],
        group: ['commentId', 'reactionName'],
      });

      if (commentReactions && commentReactions.length > 0) {
        for (const commentReaction of commentReactions) {
          const reactionName = commentReaction.reactionName;
          const commentId = commentReaction.commentId;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const reactionCount = commentReaction.getDataValue('count');

          // use raw query instead of create method
          await this._reactionCommentDetailsModel.sequelize.query(`
                INSERT INTO ${schema}.reaction_comment_details (reaction_name, comment_id, count, created_at, updated_at)
                VALUES ('${reactionName}', '${commentId}', ${reactionCount}, NOW(), NOW())
                ON CONFLICT (reaction_name, comment_id)
                DO UPDATE SET count = EXCLUDED.count, updated_at = NOW();
            `);
        }
      }

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
