import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { CommentNotificationPayload } from '../../../../v2-notification/application/application-services/interface';
import { CommentDeletedEvent } from '../../../domain/event/comment.event';
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

@EventsHandlerAndLog(CommentDeletedEvent)
export class NotiCommentDeletedEventHandler implements IEventHandler<CommentDeletedEvent> {
  public constructor(
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: CommentDeletedEvent): Promise<void> {
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
      event: CommentDeletedEvent.event,
      actor,
      comment: commentDto,
      content: contentDto,
    };

    await this._notiAdapter.sendCommentNotification(payload);
  }
}
