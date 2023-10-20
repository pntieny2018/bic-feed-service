import { CONTENT_TARGET } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { ReactionHasBeenCreated, ReactionHasBeenRemoved } from '../../../../../common/constants';
import { ObjectHelper } from '../../../../../common/helpers';
import { ReactionNotificationPayload } from '../../../../v2-notification/application/application-services/interface';
import { ReactionNotifyEvent } from '../../../domain/event';
import { ContentEntity } from '../../../domain/model/content';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  IUserAdapter,
  NOTIFICATION_ADAPTER,
  USER_ADAPTER,
} from '../../../domain/service-adapter-interface';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
  CONTENT_BINDING_TOKEN,
  IContentBinding,
  REACTION_BINDING_TOKEN,
  IReactionBinding,
} from '../../binding';
import { ArticleDto, PostDto } from '../../dto';

@EventsHandler(ReactionNotifyEvent)
export class ReactionNotifyEventHandler implements IEventHandler<ReactionNotifyEvent> {
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

  public async handle(event: ReactionNotifyEvent): Promise<void> {
    const { reactionEntity, action } = event;

    const reactionActor = await this._userAdapter.getUserById(reactionEntity.get('createdBy'));

    const reactionDto = await this._reactionBinding.binding(reactionEntity);

    const payload: ReactionNotificationPayload = {
      event: action === 'create' ? ReactionHasBeenCreated : ReactionHasBeenRemoved,
      actor: ObjectHelper.omit(['groups', 'permissions'], reactionActor) as UserDto,
      reaction: reactionDto,
      content: null,
      comment: null,
    };

    if (reactionEntity.get('target') === CONTENT_TARGET.COMMENT) {
      const commentEntity = await this._commentRepository.findOne(
        { id: reactionEntity.get('targetId') },
        {
          includeOwnerReactions: reactionActor.id,
        }
      );

      if (!commentEntity) {
        return;
      }

      const commentActor = await this._userAdapter.getUserById(commentEntity.get('createdBy'));

      payload.comment = (
        await this._commentBinding.commentsBinding([commentEntity], commentActor)
      )[0];

      payload.content = await this._getContentDto(commentEntity.get('postId'), reactionActor.id);

      if (commentEntity.isChildComment()) {
        const parentCommentEntity = await this._commentRepository.findOne({
          id: commentEntity.get('parentId'),
        });

        if (!parentCommentEntity) {
          return;
        }

        const parentCommentActor = await this._userAdapter.getUserById(
          parentCommentEntity.get('createdBy')
        );

        payload.parentComment = (
          await this._commentBinding.commentsBinding([parentCommentEntity], parentCommentActor)
        )[0];
      }
    } else {
      payload.content = await this._getContentDto(reactionEntity.get('targetId'), reactionActor.id);
    }

    await this._notificationAdapter.sendReactionNotification(payload);
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
    if (!contentEntity || contentEntity.isHidden()) {
      return;
    }

    const contentActor = await this._userAdapter.getUserById(
      (contentEntity as ContentEntity).get('createdBy'),
      { withPermission: true, withGroupJoined: true }
    );

    const contentDto = await this._contentBinding.contentsBinding([contentEntity], contentActor);
    return contentDto[0] as PostDto | ArticleDto;
  }
}
