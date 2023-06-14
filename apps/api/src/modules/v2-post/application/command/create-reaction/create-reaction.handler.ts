import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateReactionCommand } from './create-reaction.command';
import {
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post-reaction.repository.interface';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
} from '../../../domain/repositoty-interface/comment-reaction.repository.interface';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { ReactionDuplicateException } from '../../../domain/exception/reaction-duplicate.exception';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';
import { ReactionDto } from '../../dto';
import { ContentNoReactPermissionException } from '../../../domain/exception/content-no-react-permission.exception';

@CommandHandler(CreateReactionCommand)
export class CreateReactionHandler implements ICommandHandler<CreateReactionCommand, ReactionDto> {
  @Inject(POST_REACTION_REPOSITORY_TOKEN)
  private readonly _postReactionRepository: IPostReactionRepository;
  @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
  private readonly _commentReactionRepository: ICommentReactionRepository;
  @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
  private readonly _reactionDomainService: IReactionDomainService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;

  public async execute(command: CreateReactionCommand): Promise<ReactionDto> {
    const newCreateReactionDto = CreateReactionHandler.transformReactionNameNodeEmoji(
      command.payload
    );

    let reactionEntity;
    if (command.payload.target === REACTION_TARGET.COMMENT) {
      reactionEntity = await this._commentReactionRepository.findOne({
        commentId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    } else {
      reactionEntity = await this._postReactionRepository.findOne({
        postId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    }
    if (reactionEntity) {
      throw new ReactionDuplicateException();
    }

    if (newCreateReactionDto.target !== REACTION_TARGET.COMMENT && !reactionEntity.allowReact()) {
      throw new ContentNoReactPermissionException();
    }

    const newReactionEntity = await this._reactionDomainService.createReaction(
      newCreateReactionDto
    );
    const actors = await this._userAppService.findOne(newReactionEntity.get('createdBy'));

    return new ReactionDto({
      id: newReactionEntity.get('id'),
      reactionName: newReactionEntity.get('reactionName'),
      createdAt: newReactionEntity.get('createdAt'),
      actor: actors,
    });
  }

  public static transformReactionNameNodeEmoji<T>(doActionReactionDto: T): T {
    const copy = { ...doActionReactionDto };
    if (copy['reactionName'] === '+1') {
      copy['reactionName'] = 'thumbsup';
    }
    if (copy['reactionName'] === '-1') {
      copy['reactionName'] = 'thumbsdown';
    }
    return copy;
  }

  private _sendNotification(type: REACTION_TARGET) {
    if (type === REACTION_TARGET.COMMENT) {
    }
  }
}
