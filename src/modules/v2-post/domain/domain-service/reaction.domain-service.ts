import { Inject, Logger } from '@nestjs/common';
import { IReactionDomainService, ReactionCreateProps } from './interface';
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
} from '../repositoty-interface';
import { ReactionEnum } from '../../../reaction/reaction.enum';
import { ReactionEntity } from '../model/reaction/reaction.entity';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { CreateReactionInternalEvent } from '../../../../events/reaction';

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

      // TODO implement this
      // this._emitter.emit(
      //   new CreateReactionInternalEvent({
      //     actor: userDto,
      //     post: post,
      //     reaction: reaction,
      //   })
      // );
      return postReactionEntity;
    } else if (target === ReactionEnum.COMMENT) {
      const commentReactionEntity = this._commentReactionFactory.create({
        reactionName,
        createdBy,
        commentId: targetId,
      });
      await this._commentReactionRepository.create(commentReactionEntity);
      await commentReactionEntity.commit();
      // TODO implement this
      // this._emitter.emit(
      //   new CreateReactionInternalEvent({
      //     actor: userDto,
      //     post: post,
      //     comment: comment,
      //     reaction: reaction,
      //   })
      // );
      return commentReactionEntity;
    } else {
      throw new Error('Invalid target');
    }
  }

  public async deleteReaction(reactionId: string): Promise<void> {
    try {
      await this._postReactionRepository.delete(reactionId);
    } catch (e) {
      this._logger.error(e.message);
      throw new DatabaseException();
    }
  }
}
