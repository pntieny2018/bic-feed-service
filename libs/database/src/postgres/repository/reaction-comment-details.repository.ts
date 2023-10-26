import { ReactionCommentDetailsModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class ReactionCommentDetailsRepository extends BaseRepository<ReactionCommentDetailsModel> {
  public constructor() {
    super(ReactionCommentDetailsModel);
  }

  public async increaseReactionCount(reactionName: string, commentId: string): Promise<void> {
    const reactionCommentDetails = await this.getModel().findOne({
      where: {
        reactionName,
        commentId,
      },
    });
    if (!reactionCommentDetails) {
      await this.getModel().create({
        reactionName,
        commentId,
        count: 1,
      });
    } else {
      await reactionCommentDetails.increment('count', { by: 1 });
    }
  }

  public async decreaseReactionCount(reactionName: string, commentId: string): Promise<void> {
    const reactionCommentDetails = await this.getModel().findOne({
      where: {
        reactionName,
        commentId,
      },
    });
    if (!reactionCommentDetails) {
      return;
    }
    if (reactionCommentDetails.count === 1) {
      await reactionCommentDetails.destroy();
    }
    await reactionCommentDetails.decrement('count', { by: 1 });
  }
}
