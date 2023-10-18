import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ObjectHelper } from '../../../../../common/helpers';
import { CommentNotificationPayload } from '../../../../v2-notification/application/application-services/interface';
import {
  CommentRecipientDto,
  ReplyCommentRecipientDto,
} from '../../../../v2-notification/application/dto';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../domain/domain-service/interface';
import { CommentCreatedEvent } from '../../../domain/event/comment.event';
import { ContentNotFoundException } from '../../../domain/exception';
import { CommentEntity } from '../../../domain/model/comment';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import {
  COMMENT_BINDING_TOKEN,
  CONTENT_BINDING_TOKEN,
  ICommentBinding,
  IContentBinding,
} from '../../binding';
import { ArticleDto, PostDto } from '../../dto';

@EventsHandlerAndLog(CommentCreatedEvent)
export class NotiCommentCreatedEventHandler implements IEventHandler<CommentCreatedEvent> {
  public constructor(
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: CommentCreatedEvent): Promise<void> {
    const { comment, actor } = event.payload;

    const commentDto = await this._commentBinding.commentBinding(comment, {
      actor,
    });

    const content = await this._contentRepository.findContentByIdInActiveGroup(commentDto.postId, {
      mustIncludeGroup: true,
    });

    if (!content || content.isHidden()) {
      throw new ContentNotFoundException();
    }
    const contentDto = (await this._contentBinding.contentsBinding([content], actor))[0] as
      | PostDto
      | ArticleDto;

    const payload: CommentNotificationPayload = {
      event: CommentCreatedEvent.event,
      actor: ObjectHelper.omit(['groups', 'permissions'], actor) as UserDto,
      comment: commentDto,
      content: contentDto,
    };

    const recipientObj = {
      commentRecipient: CommentRecipientDto.init(),
      replyCommentRecipient: ReplyCommentRecipientDto.init(),
    };

    const prevComments: CommentEntity[] = [];

    const recipient = await this._commentDomainService.dissociateComment({
      commentId: comment.get('id'),
      userId: actor.id,
      contentDto,
      cb: (comments) => {
        prevComments.push(...comments);
      },
    });

    if (comment.isChildComment()) {
      const parentComment = await this._commentDomainService.getVisibleComment(
        comment.get('parentId')
      );
      payload.parentComment = await this._commentBinding.commentBinding(parentComment);

      recipientObj.replyCommentRecipient = recipient as ReplyCommentRecipientDto;
      const { mentionedUserIdsInComment, mentionedUserIdsInParentComment } =
        recipientObj.replyCommentRecipient;

      recipientObj.replyCommentRecipient.mentionedUserIdsInParentComment =
        await this._filterUserWasReported(commentDto.parentId, mentionedUserIdsInParentComment);

      recipientObj.replyCommentRecipient.mentionedUserIdsInComment =
        await this._filterUserWasReported(contentDto.id, mentionedUserIdsInComment);

      payload.replyCommentRecipient = recipientObj.replyCommentRecipient;
    } else {
      recipientObj.commentRecipient = recipient as CommentRecipientDto;

      const { mentionedUsersInComment, mentionedUsersInPost } = recipientObj.commentRecipient;

      recipientObj.commentRecipient.mentionedUsersInComment = await this._filterUserWasReported(
        contentDto.id,
        mentionedUsersInComment
      );

      recipientObj.commentRecipient.mentionedUsersInPost = await this._filterUserWasReported(
        contentDto.id,
        mentionedUsersInPost
      );
      payload.commentRecipient = recipientObj.commentRecipient;

      if (prevComments.length) {
        payload.prevCommentActivities = await this._commentBinding.commentsBinding(prevComments);
      }
    }

    await this._notiAdapter.sendCommentNotification(payload);
  }

  private async _filterUserWasReported(targetId: string, userIds: string[]): Promise<string[]> {
    if (!userIds || !userIds?.length) {
      return [];
    }

    const actorReportedIds = await this._contentRepository.findActorReportIds(targetId);

    return userIds.filter((userId) => !actorReportedIds.includes(userId));
  }
}
