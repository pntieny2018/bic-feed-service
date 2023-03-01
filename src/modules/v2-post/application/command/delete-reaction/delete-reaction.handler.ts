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
import { ReactionEnum } from '../../../../reaction/reaction.enum';
import { ReactionNotFoundException } from '../../../exception/reaction-not-found.exception';
import { ReactionEntity } from '../../../domain/model/reaction/reaction.entity';

@CommandHandler(DeleteReactionCommand)
export class DeleteReactionHandler implements ICommandHandler<DeleteReactionCommand, void> {
  @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
  private readonly _reactionDomainService: IReactionDomainService;
  @Inject(POST_REACTION_REPOSITORY_TOKEN)
  private readonly _postReactionRepository: IPostReactionRepository;
  @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
  private readonly _commentReactionRepository: ICommentReactionRepository;

  public async execute(command: DeleteReactionCommand): Promise<void> {
    const { target } = command.payload;
    const conditions = {};
    if (target === ReactionEnum.COMMENT) {
      conditions['commentId'] = command.payload.targetId;
    } else if (target === ReactionEnum.POST) {
      conditions['postId'] = command.payload.targetId;
    }
    if (command.payload.reactionId) {
      conditions['id'] = command.payload.reactionId;
    }
    if (command.payload.reactionName) {
      conditions['reactionName'] = command.payload.reactionName;
    }
    const reaction =
      target === ReactionEnum.COMMENT
        ? await this._commentReactionRepository.findOne(conditions)
        : await this._postReactionRepository.findOne(conditions);
    if (!reaction) {
      throw new ReactionNotFoundException();
    }

    await this._reactionDomainService.deleteReaction((reaction as ReactionEntity).get('id'));
  }
}
