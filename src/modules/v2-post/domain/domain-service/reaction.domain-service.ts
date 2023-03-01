import { Inject, Logger } from '@nestjs/common';
import {
  IReactionDomainService,
  ReactionCreateProps,
  ReactionUpdateProps,
} from './interface/reaction.domain-service.interface';
import {
  COMMENT_REACTION_FACTORY_TOKEN,
  ICommentReactionFactory,
  IPostReactionFactory,
  POST_REACTION_FACTORY_TOKEN,
} from '../factory';
import { IPostReactionRepository, POST_REACTION_REPOSITORY_TOKEN } from '../repositoty-interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
} from '../repositoty-interface/comment-reaction.repository.interface';
import { ReactionEnum } from '../../../reaction/reaction.enum';
import { ReactionEntity } from '../model/reaction/reaction.entity';

export class ReactionDomainService implements IReactionDomainService {
  private readonly _logger = new Logger(ReactionDomainService.name);

  @Inject(POST_REACTION_REPOSITORY_TOKEN)
  private readonly _postReactionRepository: IPostReactionRepository;
  @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
  private readonly _commentReactionRepository: ICommentReactionRepository;
  @Inject(POST_REACTION_FACTORY_TOKEN)
  private readonly _postReactionFactory: IPostReactionFactory;
  @Inject(COMMENT_REACTION_FACTORY_TOKEN)
  private readonly _commentReactionFactory: ICommentReactionFactory;

  public async createReaction(input: ReactionCreateProps): Promise<ReactionEntity> {
    const { reactionName, createdBy, target, targetId } = input;

    if (target === ReactionEnum.POST || target === ReactionEnum.ARTICLE) {
      const postReactionEntity = this._postReactionFactory.create({
        reactionName,
        createdBy,
        postId: targetId,
      });
      await this._postReactionRepository.create(postReactionEntity);
      await postReactionEntity.commit();
      return postReactionEntity;
    } else if (target === ReactionEnum.COMMENT) {
      const commentReactionEntity = this._commentReactionFactory.create({
        reactionName,
        createdBy,
        commentId: targetId,
      });
      await this._commentReactionRepository.create(commentReactionEntity);
      await commentReactionEntity.commit();
      return commentReactionEntity;
    } else {
      throw new Error('Invalid target');
    }
  }

  public async updateReaction(
    reaction: ReactionEntity,
    input: ReactionUpdateProps
  ): Promise<ReactionEntity> {
    return null;
  }

  public async deleteReaction(reactionId: string): Promise<void> {
    return;
  }
}
