import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteReactionCommand } from './delete-reaction.command';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { ReactionNotFoundException } from '../../../exception';
import { ReactionEntity } from '../../../domain/model/reaction/reaction.entity';
import { REACTION_TARGET } from '../../../data-type';
import { ReactionNotHaveAuthorityException } from '../../../exception/reaction-not-have-authority.exception';

@CommandHandler(DeleteReactionCommand)
export class DeleteReactionHandler implements ICommandHandler<DeleteReactionCommand, void> {
  @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
  private readonly _reactionDomainService: IReactionDomainService;
  @Inject(POST_REACTION_REPOSITORY_TOKEN)
  private readonly _postReactionRepository: IPostReactionRepository;
  @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
  private readonly _commentReactionRepository: ICommentReactionRepository;

  public async execute(command: DeleteReactionCommand): Promise<void> {
    const { target, targetId, reactionName, reactionId, userId } = command.payload;
    const conditions = {
      reactionName,
    };
    if (target === REACTION_TARGET.COMMENT) {
      conditions['commentId'] = targetId;
    } else if (target === REACTION_TARGET.POST) {
      conditions['postId'] = targetId;
    }
    if (reactionId) {
      conditions['id'] = reactionId;
    }
    const reaction =
      target === REACTION_TARGET.COMMENT
        ? await this._commentReactionRepository.findOne(conditions)
        : await this._postReactionRepository.findOne(conditions);
    if (!reaction) {
      throw new ReactionNotFoundException();
    }

    if ((reaction as ReactionEntity).get('createdBy') !== userId) {
      throw new ReactionNotHaveAuthorityException();
    }

    await this._reactionDomainService.deleteReaction((reaction as ReactionEntity).get('id'));
  }
}
