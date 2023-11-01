import { PostReactionModel } from '@libs/database/postgres/model';
import { ReactionContentDetailsModel } from '@libs/database/postgres/model/reaction-content-details.model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner, Option } from 'nest-commander';
import { Sequelize } from 'sequelize-typescript';

interface ICommandOptions {
  rollback: boolean;
}

@Command({
  name: 'reaction:update-content-reaction-count',
  description: 'Update reaction count for contents',
})
export class UpdateContentReactionCountCommand implements CommandRunner {
  private readonly _logger = new Logger(UpdateContentReactionCountCommand.name);

  public constructor(
    @InjectModel(PostReactionModel)
    private _postReactionModel: typeof PostReactionModel,
    @InjectModel(ReactionContentDetailsModel)
    private _reactionContentDetailsModel: typeof ReactionContentDetailsModel
  ) {}

  @Option({
    flags: '-r, --rollback [boolean]',
  })
  public async run(params: string[], options?: ICommandOptions): Promise<any> {
    if (Boolean(options.rollback)) {
      return this.rollBack();
    }

    try {
      this._logger.log('Start update reaction count for contents');

      const postReactions = await this._postReactionModel.findAll({
        attributes: [
          'postId',
          'reactionName',
          [this._postReactionModel.sequelize.fn('COUNT', Sequelize.col('*')), 'count'],
        ],
        group: ['postId', 'reactionName'],
      });

      if (postReactions && postReactions.length > 0) {
        for (const postReaction of postReactions) {
          const reactionName = postReaction.reactionName;
          const contentId = postReaction.postId;

          await this._reactionContentDetailsModel.upsert({
            reactionName,
            contentId,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            count: postReaction.getDataValue('count'),
          });
        }
      }

      this._logger.log('Update reaction count successfully');
    } catch (e) {
      this._logger.error(e?.message);
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  public async rollBack(): Promise<any> {
    try {
      await this._reactionContentDetailsModel.destroy({
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
