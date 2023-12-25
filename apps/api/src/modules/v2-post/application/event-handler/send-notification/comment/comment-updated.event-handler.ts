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
import { CommentUpdatedEvent } from '../../../../domain/event';
import { ContentNotFoundException } from '../../../../domain/exception';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
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
import { ArticleDto, PostDto } from '../../../dto';

@EventsHandlerAndLog(CommentUpdatedEvent)
export class NotiCommentUpdatedEventHandler implements IEventHandler<CommentUpdatedEvent> {
  public constructor(
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,

    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomain: ICommentDomainService,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,

    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: CommentUpdatedEvent): Promise<void> {
    const { comment, authUser, oldComment } = event.payload;

    const commentDto = await this._commentBinding.commentBinding(comment);

    const content = await this._contentRepo.findContentByIdInActiveGroup(commentDto.postId, {
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
    const newMentions = comment.get('mentions').filter((mention) => {
      return !oldComment.get('mentions').includes(mention);
    });

    const recipientObj = {
      commentRecipient: CommentRecipientDto.init(),
      replyCommentRecipient: ReplyCommentRecipientDto.init(),
    };

    if (comment.isChildComment()) {
      const parentComment = await this._commentDomain.getVisibleComment(comment.get('parentId'));
      const parentCommentDto = await this._commentBinding.commentBinding(parentComment);
      recipientObj.replyCommentRecipient.mentionedUserIdsInComment = newMentions;
      const replyCommentRecipient = recipientObj.replyCommentRecipient;

      return this._notiAdapter.sendChildCommentUpdatedNotification({
        ...payload,
        parentComment: parentCommentDto,
        replyCommentRecipient,
      });
    } else {
      recipientObj.commentRecipient.mentionedUsersInComment =
        recipientObj.commentRecipient.mentionedUsersInComment =
          await this._filterOutUserWasReported(contentDto.id, newMentions);
      const commentRecipient = recipientObj.commentRecipient;

      return this._notiAdapter.sendCommentUpdatedNotification({
        ...payload,
        commentRecipient,
      });
    }
  }

  private async _filterOutUserWasReported(targetId: string, userIds: string[]): Promise<string[]> {
    if (!userIds || !userIds?.length) {
      return [];
    }

    const userIdsReported = await this._reportRepo.getReporterIdsByTargetId(targetId);

    return userIds.filter((userId) => !userIdsReported.includes(userId));
  }
}
