import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteReactionCommand } from './delete-reaction.command';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import {
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
} from '../../../domain/repositoty-interface';
import {
  ReactionNotFoundException,
  ReactionNotHaveAuthorityException,
} from '../../../domain/exception';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';

@CommandHandler(DeleteReactionCommand)
export class DeleteReactionHandler implements ICommandHandler<DeleteReactionCommand, void> {
  @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
  private readonly _reactionDomainService: IReactionDomainService;
  @Inject(POST_REACTION_REPOSITORY_TOKEN)
  private readonly _postReactionRepository: IPostReactionRepository;
  @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
  private readonly _commentReactionRepository: ICommentReactionRepository;

  public async execute(command: DeleteReactionCommand): Promise<void> {
    const { target, targetId, reactionName, userId } = command.payload;
    const conditions = {
      reactionName,
      createdBy: userId,
    };

    switch (target) {
      case REACTION_TARGET.COMMENT:
        conditions['commentId'] = targetId;
        break;
      case REACTION_TARGET.POST:
      case REACTION_TARGET.ARTICLE:
        conditions['postId'] = targetId;
        break;
      default:
        break;
    }

    const reaction =
      target === REACTION_TARGET.COMMENT
        ? await this._commentReactionRepository.findOne(conditions)
        : await this._postReactionRepository.findOne(conditions);
    if (!reaction) {
      throw new ReactionNotFoundException();
    }

    if (reaction.get('createdBy') !== userId) {
      throw new ReactionNotHaveAuthorityException();
    }

    await this._reactionDomainService.deleteReaction(command.payload.target, reaction.get('id'));
  }
}
