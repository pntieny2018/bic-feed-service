import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { CommentNotificationPayload } from '../../../../v2-notification/application/application-services/interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { CommentDeletedEvent } from '../../../domain/event/comment.event';
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
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async handle(event: CommentDeletedEvent): Promise<void> {
    const { comment, user } = event.payload;

    const commentDto = await this._commentBinding.commentBinding(comment, {
      actor: user,
    });

    const content = await this._contentDomainService.getContentById(comment.get('postId'), user.id);
    const contentDto = (await this._contentBinding.contentsBinding([content], user))[0] as
      | PostDto
      | ArticleDto;

    const payload: CommentNotificationPayload = {
      event: CommentDeletedEvent.event,
      actor: user,
      comment: commentDto,
      content: contentDto,
    };

    await this._notiAdapter.sendCommentNotification(payload);
  }
}
