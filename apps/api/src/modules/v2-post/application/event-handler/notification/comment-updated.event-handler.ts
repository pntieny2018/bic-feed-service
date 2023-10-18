import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { CommentNotificationPayload } from '../../../../v2-notification/application/application-services/interface';
import {
  CommentRecipientDto,
  ReplyCommentRecipientDto,
} from '../../../../v2-notification/application/dto';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../domain/domain-service/interface';
import { CommentUpdatedEvent } from '../../../domain/event/comment.event';
import { ContentNotFoundException } from '../../../domain/exception';
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

@EventsHandlerAndLog(CommentUpdatedEvent)
export class NotiCommentUpdatedEventHandler implements IEventHandler<CommentUpdatedEvent> {
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

  public async handle(event: CommentUpdatedEvent): Promise<void> {
    const { comment, actor, oldComment } = event.payload;

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
      event: CommentUpdatedEvent.event,
      actor,
      comment: commentDto,
      content: contentDto,
    };
    const newMentions = comment.get('mentions').filter((mention) => {
      return !oldComment.get('mentions').includes(mention);
    });

    const recipientObj = {
      commentRecipient: CommentRecipientDto.init(),
      replyCommentRecipient: ReplyCommentRecipientDto.init(),
    };

    if (comment.isChildComment()) {
      const parentComment = await this._commentDomainService.getVisibleComment(
        comment.get('parentId')
      );
      payload.parentComment = await this._commentBinding.commentBinding(parentComment);
      recipientObj.replyCommentRecipient.mentionedUserIdsInComment = newMentions;
      payload.replyCommentRecipient = recipientObj.replyCommentRecipient;
    } else {
      recipientObj.commentRecipient.mentionedUsersInComment =
        recipientObj.commentRecipient.mentionedUsersInComment = await this._filterUserWasReported(
          contentDto.id,
          newMentions
        );
      payload.commentRecipient = recipientObj.commentRecipient;
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
