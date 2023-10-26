import { CommentReactionModel, PostReactionModel } from '@libs/database/postgres/model';
import { ReactionCommentDetailsModel } from '@libs/database/postgres/model/reaction-comment-details.model';
import { ReactionContentDetailsModel } from '@libs/database/postgres/model/reaction-content-details.model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'reaction:update-reaction-count',
  description: 'Update reaction count for contents and reactions',
})
export class UpdateReactionCountCommand implements CommandRunner {
  private readonly _logger = new Logger(UpdateReactionCountCommand.name);

  public constructor(
    @InjectModel(PostReactionModel) private _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel) private _commentReactionModel: typeof CommentReactionModel,
    @InjectModel(ReactionContentDetailsModel)
    private _reactionContentDetailsModel: typeof ReactionContentDetailsModel,
    @InjectModel(ReactionCommentDetailsModel)
    private _reactionCommentDetailsModel: typeof ReactionCommentDetailsModel
  ) {}

  public async run(): Promise<any> {
    try {
      const limit = 1000;
      let offset = 0;

      this._logger.log('Start update reaction count for contents');
      while (true) {
        const postReactions = await this._postReactionModel.findAll({
          limit,
          offset,
        });
        if (!postReactions || postReactions.length === 0) {
          break;
        }
        for (const postReaction of postReactions) {
          const reactionName = postReaction.reactionName;
          const contentId = postReaction.postId;
          const reactionContentDetails = await this._reactionContentDetailsModel.findOne({
            where: {
              reactionName,
              contentId,
            },
          });
          if (!reactionContentDetails) {
            await this._reactionContentDetailsModel.create({
              reactionName,
              contentId,
              count: 1,
            });
          } else {
            await reactionContentDetails.increment('count', { by: 1 });
          }
        }

        offset += limit;
      }

      offset = 0;
      this._logger.log('Start update reaction count for comments');
      while (true) {
        const commentReactions = await this._commentReactionModel.findAll({
          limit,
          offset,
        });
        if (!commentReactions || commentReactions.length === 0) {
          break;
        }
        for (const commentReaction of commentReactions) {
          const reactionName = commentReaction.reactionName;
          const commentId = commentReaction.commentId;
          const reactionCommentDetails = await this._reactionCommentDetailsModel.findOne({
            where: {
              reactionName,
              commentId,
            },
          });
          if (!reactionCommentDetails) {
            await this._reactionCommentDetailsModel.create({
              reactionName,
              commentId,
              count: 1,
            });
          } else {
            await reactionCommentDetails.increment('count', { by: 1 });
          }
        }
        offset += limit;
      }

      this._logger.log('Update reaction count successfully');
    } catch (e) {}
    process.exit();
  }
}
