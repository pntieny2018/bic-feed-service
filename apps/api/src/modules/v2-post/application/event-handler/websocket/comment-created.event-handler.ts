import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { CommentCreatedEvent } from '../../../domain/event/comment.event';
import { ContentNotFoundException } from '../../../domain/exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IWebsocketAdapter, WEBSOCKET_ADAPTER } from '../../../domain/service-adapter-interface';
import { COMMENT_BINDING_TOKEN, ICommentBinding } from '../../binding';

@EventsHandlerAndLog(CommentCreatedEvent)
export class WsCommentCreatedEventHandler implements IEventHandler<CommentCreatedEvent> {
  public constructor(
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(WEBSOCKET_ADAPTER)
    private readonly _websocketAdapter: IWebsocketAdapter
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

    await this._websocketAdapter.emitCommentCreatedEvent({
      event: CommentCreatedEvent.event,
      recipients: content.getGroupIds(),
      contentType: content.getType(),
      contentId: content.getId(),
      comment: commentDto,
    });
  }
}
