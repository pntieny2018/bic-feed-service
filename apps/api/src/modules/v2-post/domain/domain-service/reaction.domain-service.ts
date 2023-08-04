import { ReactionEntity } from '../model/reaction';
import { Inject, Logger } from '@nestjs/common';
import {
  IReactionDomainService,
  ReactionCreateProps,
} from './interface/reaction.domain-service.interface';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../factory/interface/reaction.factory.interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { REACTION_TARGET } from '../../data-type';
export class ReactionDomainService implements IReactionDomainService {
  private readonly _logger = new Logger(ReactionDomainService.name);

  @Inject(POST_REACTION_REPOSITORY_TOKEN)
  private readonly _postReactionRepository: IPostReactionRepository;
  @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
  private readonly _commentReactionRepository: ICommentReactionRepository;
  @Inject(REACTION_FACTORY_TOKEN)
  private readonly _reactionFactory: IReactionFactory;

  public async createReaction(input: ReactionCreateProps): Promise<ReactionEntity> {
    const { reactionName, createdBy, target, targetId } = input;
    const reactionEntity = this._reactionFactory.create({
      target,
      reactionName,
      createdBy,
      targetId: targetId,
    });
    if (target === REACTION_TARGET.POST || target === REACTION_TARGET.ARTICLE) {
      await this._postReactionRepository.create(reactionEntity);
      reactionEntity.commit();

      // TODO implement this
      // this._emitter.emit(
      //   new CreateReactionInternalEvent({
      //     actor: userDto,
      //     post: post,
      //     reaction: reaction,
      //   })
      // );
      return reactionEntity;
    } else if (target === REACTION_TARGET.COMMENT) {
      await this._commentReactionRepository.create(reactionEntity);
      reactionEntity.commit();
      // TODO implement this
      // this._emitter.emit(
      //   new CreateReactionInternalEvent({
      //     actor: userDto,
      //     post: post,
      //     comment: comment,
      //     reaction: reaction,
      //   })
      // );
      return reactionEntity;
    } else {
      throw new DatabaseException();
    }
  }

  public async deleteReaction(target: REACTION_TARGET, reactionId: string): Promise<void> {
    try {
      if (target === REACTION_TARGET.POST || target === REACTION_TARGET.ARTICLE) {
        await this._postReactionRepository.delete(reactionId);
      } else if (target === REACTION_TARGET.COMMENT) {
        await this._commentReactionRepository.delete(reactionId);
      }
    } catch (e) {
      this._logger.error(e.message);
      throw new DatabaseException();
    }
  }
}
