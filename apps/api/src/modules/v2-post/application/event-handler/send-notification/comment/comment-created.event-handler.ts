import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  CommentRecipientDto,
  ReplyCommentRecipientDto,
} from '../../../../../v2-notification/application/dto';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../../domain/domain-service/interface';
import { CommentCreatedEvent } from '../../../../domain/event';
import { ContentNotFoundException } from '../../../../domain/exception';
import { CommentEntity } from '../../../../domain/model/comment';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import {
  COMMENT_BINDING_TOKEN,
  CONTENT_BINDING_TOKEN,
  ICommentBinding,
  IContentBinding,
} from '../../../binding';
import { ArticleDto, CommentExtendedDto, PostDto } from '../../../dto';

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
    const { comment, authUser } = event.payload;

    const commentDto = await this._commentBinding.commentBinding(comment, {
      actor: authUser,
    });

    const content = await this._contentRepository.findContentByIdInActiveGroup(commentDto.postId, {
      mustIncludeGroup: true,
    });

    if (!content || content.isHidden()) {
      throw new ContentNotFoundException();
    }
    const contentDto = (await this._contentBinding.contentsBinding([content], authUser))[0] as
      | PostDto
      | ArticleDto;

    const payload = {
      actor: authUser,
      comment: commentDto,
      content: contentDto,
    };

    const recipientObj = {
      commentRecipient: CommentRecipientDto.init(),
      replyCommentRecipient: ReplyCommentRecipientDto.init(),
    };

    const prevComments: CommentEntity[] = [];

    const recipient = await this._commentDomainService.getRelevantUserIdsInComment({
      commentEntity: comment,
      userId: authUser.id,
      contentDto,
      cb: (comments) => {
        prevComments.push(...comments);
      },
    });

    if (comment.isChildComment()) {
      const parentComment = await this._commentDomainService.getVisibleComment(
        comment.get('parentId')
      );
      const parentCommentDto = await this._commentBinding.commentBinding(parentComment);

      recipientObj.replyCommentRecipient = recipient as ReplyCommentRecipientDto;
      const { mentionedUserIdsInComment, mentionedUserIdsInParentComment } =
        recipientObj.replyCommentRecipient;

      recipientObj.replyCommentRecipient.mentionedUserIdsInParentComment =
        await this._filterOutUserWasReported(commentDto.parentId, mentionedUserIdsInParentComment);

      recipientObj.replyCommentRecipient.mentionedUserIdsInComment =
        await this._filterOutUserWasReported(contentDto.id, mentionedUserIdsInComment);

      const replyCommentRecipient = recipientObj.replyCommentRecipient;

      return this._notiAdapter.sendChildCommentCreatedNotification({
        ...payload,
        replyCommentRecipient,
        parentComment: parentCommentDto,
      });
    } else {
      recipientObj.commentRecipient = recipient as CommentRecipientDto;

      const { mentionedUsersInComment, mentionedUsersInPost } = recipientObj.commentRecipient;

      recipientObj.commentRecipient.mentionedUsersInComment = await this._filterOutUserWasReported(
        contentDto.id,
        mentionedUsersInComment
      );

      recipientObj.commentRecipient.mentionedUsersInPost = await this._filterOutUserWasReported(
        contentDto.id,
        mentionedUsersInPost
      );
      const commentRecipient = recipientObj.commentRecipient;

      let prevCommentActivities: CommentExtendedDto[] = [];
      if (prevComments.length) {
        prevCommentActivities = await this._commentBinding.commentsBinding(prevComments);
      }

      return this._notiAdapter.sendCommentCreatedNotification({
        ...payload,
        commentRecipient,
        prevCommentActivities,
      });
    }
  }

  private async _filterOutUserWasReported(targetId: string, userIds: string[]): Promise<string[]> {
    if (!userIds || !userIds?.length) {
      return [];
    }

    const userIdsReported = await this._contentRepository.findUserIdsReportedTargetId(targetId);

    return userIds.filter((userId) => !userIdsReported.includes(userId));
  }
}
