import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { NIL } from 'uuid';

import { ReactionDeletedEvent } from '../../../../domain/event';
import { CommentNotFoundException, ContentNotFoundException } from '../../../../domain/exception';
import { ContentEntity } from '../../../../domain/model/content';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  IUserAdapter,
  NOTIFICATION_ADAPTER,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import {
  COMMENT_BINDING_TOKEN,
  CONTENT_BINDING_TOKEN,
  ICommentBinding,
  IContentBinding,
  IReactionBinding,
  REACTION_BINDING_TOKEN,
} from '../../../binding';
import { ArticleDto, CommentExtendedDto, PostDto } from '../../../dto';

@EventsHandlerAndLog(ReactionDeletedEvent)
export class NotiDeletedReactionEventHandler implements IEventHandler<ReactionDeletedEvent> {
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(REACTION_BINDING_TOKEN)
    private readonly _reactionBinding: IReactionBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notificationAdapter: INotificationAdapter
  ) {}

  public async handle(event: ReactionDeletedEvent): Promise<void> {
    const { reactionEntity } = event.payload;

    const reactionActor = await this._userAdapter.getUserById(reactionEntity.get('createdBy'));

    const reactionDto = await this._reactionBinding.binding(reactionEntity);

    const payload: any = {
      event: event.getEventName(),
      actor: reactionActor,
      reaction: reactionDto,
    };

    if (reactionEntity.get('target') === CONTENT_TARGET.COMMENT) {
      const commentDto = await this._getCommentDto(
        reactionEntity.get('targetId'),
        reactionActor.id
      );
      payload.comment = commentDto;

      payload.content = await this._getContentDto(commentDto.postId, reactionActor.id);

      if (commentDto.parentId !== NIL) {
        payload.parentComment = await this._getCommentDto(commentDto.parentId);
        return this._notificationAdapter.sendReactionReplyCommentNotification(payload);
      } else {
        return this._notificationAdapter.sendReactionCommentNotification(payload);
      }
    } else {
      payload.content = await this._getContentDto(reactionEntity.get('targetId'), reactionActor.id);
      return this._notificationAdapter.sendReactionContentNotification(payload);
    }
  }

  private async _getContentDto(
    contentId: string,
    reactionActorId: string
  ): Promise<PostDto | ArticleDto> {
    const contentEntity = await this._contentRepository.findOne({
      where: { id: contentId },
      include: {
        mustIncludeGroup: true,
        shouldIncludeReaction: {
          userId: reactionActorId,
        },
      },
    });
    if (!contentEntity || contentEntity.isHidden() || !contentEntity.isPublished()) {
      throw new ContentNotFoundException();
    }

    const contentActor = await this._userAdapter.getUserByIdWithPermission(
      (contentEntity as ContentEntity).get('createdBy')
    );

    const contentDto = await this._contentBinding.contentsBinding([contentEntity], contentActor);
    return contentDto[0] as PostDto | ArticleDto;
  }

  private async _getCommentDto(
    commentId: string,
    reactionActorId?: string
  ): Promise<CommentExtendedDto> {
    const commentEntity = await this._commentRepository.findOne(
      { id: commentId },
      reactionActorId && {
        includeOwnerReactions: reactionActorId,
      }
    );

    if (!commentEntity) {
      throw new CommentNotFoundException();
    }

    return (await this._commentBinding.commentsBinding([commentEntity]))[0];
  }
}
