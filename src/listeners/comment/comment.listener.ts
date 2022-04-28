import { On } from '../../common/decorators';
import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { Injectable, Logger } from '@nestjs/common';
import { CommentNotificationService } from '../../notification/services';
import { CommentService } from '../../modules/comment';

@Injectable()
export class CommentListener {
  private _logger = new Logger(CommentListener.name);
  public constructor(
    private _commentService: CommentService,
    private _commentNotificationService: CommentNotificationService
  ) {}

  @On(CommentHasBeenCreatedEvent)
  public async onCommentHasBeenCreated(event: CommentHasBeenCreatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenCreatedEvent]: ${JSON.stringify(event)}`);

    const { commentResponse, actor } = event.payload;

    if (commentResponse.parentId) {
      commentResponse.parent = await this._commentService.getComment(
        actor,
        commentResponse.parentId,
        0
      );
    }
    this._commentNotificationService
      .create(event.getEventName(), actor, commentResponse)
      .catch((ex) => this._logger.error(ex, ex.stack));
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenUpdatedEvent]: ${JSON.stringify(event)}`);

    const { oldComment, commentResponse, actor } = event.payload;

    this._commentNotificationService
      .update(event.getEventName(), actor, oldComment, commentResponse)
      .catch((ex) => this._logger.error(ex, ex.stack));
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenDeletedEvent]: ${JSON.stringify(event)}`);
    const { comment, actor } = event.payload;

    this._commentNotificationService
      .destroy(event.getEventName(), comment)
      .catch((ex) => this._logger.error(ex, ex.stack));
  }
}
