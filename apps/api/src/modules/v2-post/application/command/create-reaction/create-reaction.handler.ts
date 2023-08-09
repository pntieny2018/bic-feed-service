import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
import { ReactionDuplicateException } from '../../../domain/exception/reaction.exception';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';
import { ReactionDto } from '../../dto';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { CommentNotFoundException, ContentNotFoundException } from '../../../domain/exception';
import { ProcessReactionNotificationCommand } from '../process-reaction-notification/process-reaction-notification.command';

@CommandHandler(CreateReactionCommand)
export class CreateReactionHandler implements ICommandHandler<CreateReactionCommand, ReactionDto> {
  public constructor(
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository,
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepository: ICommentReactionRepository,
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _commandBus: CommandBus
  ) {}

  public async execute(command: CreateReactionCommand): Promise<ReactionDto> {
    const newCreateReactionDto = CreateReactionHandler.transformReactionNameNodeEmoji(
      command.payload
    );
    await this._validate(command);

    const newReactionEntity = await this._reactionDomainService.createReaction(
      newCreateReactionDto
    );

    const actor = await this._userAppService.findOne(newReactionEntity.get('createdBy'));

    const reaction = new ReactionDto({
      id: newReactionEntity.get('id'),
      target: newReactionEntity.get('target'),
      targetId: newReactionEntity.get('targetId'),
      reactionName: newReactionEntity.get('reactionName'),
      createdAt: newReactionEntity.get('createdAt'),
      actor,
    });

    this._commandBus.execute(
      new ProcessReactionNotificationCommand({
        reaction,
        action: 'create',
      })
    );
    return reaction;
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

  private async _validate(command: CreateReactionCommand): Promise<void> {
    let reactionEntity;
    const newCreateReactionDto = CreateReactionHandler.transformReactionNameNodeEmoji(
      command.payload
    );
    if (command.payload.target === REACTION_TARGET.COMMENT) {
      const commentEntity = await this._commentRepository.findOne({
        id: newCreateReactionDto.targetId,
      });
      if (!commentEntity) {
        throw new CommentNotFoundException();
      }
      reactionEntity = await this._commentReactionRepository.findOne({
        commentId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    } else {
      const contentEntity = (await this._contentRepository.findOne({
        where: { id: newCreateReactionDto.targetId },
        include: {
          mustIncludeGroup: true,
        },
      })) as ContentEntity;
      if (!contentEntity) {
        throw new ContentNotFoundException();
      }
      reactionEntity = await this._postReactionRepository.findOne({
        postId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    }
    if (reactionEntity) {
      throw new ReactionDuplicateException();
    }
  }
}
