import { ReactionContentDetailsModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibReactionContentDetailsRepository extends BaseRepository<ReactionContentDetailsModel> {
  public constructor() {
    super(ReactionContentDetailsModel);
  }

  public async increaseReactionCount(reactionName: string, contentId: string): Promise<void> {
    const reactionContentDetails = await this.getModel().findOne({
      where: {
        reactionName,
        contentId,
      },
    });
    if (!reactionContentDetails) {
      await this.getModel().create({
        reactionName,
        contentId,
        count: 1,
      });
    } else {
      await reactionContentDetails.increment('count', { by: 1 });
    }
  }

  public async decreaseReactionCount(reactionName: string, contentId: string): Promise<void> {
    const reactionContentDetails = await this.getModel().findOne({
      where: {
        reactionName,
        contentId,
      },
    });
    if (!reactionContentDetails) {
      return;
    }
    if (reactionContentDetails.count === 1) {
      return reactionContentDetails.destroy();
    }
    await reactionContentDetails.decrement('count', { by: 1 });
  }
}
