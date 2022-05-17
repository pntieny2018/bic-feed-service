import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { CommentService } from '../../modules/comment';
import { CommentNotificationService } from '../../notification/services';
import { SentryService } from '../../../libs/sentry/src';

@Injectable()
export class CommentListener {
  private _logger = new Logger(CommentListener.name);
  public constructor(
    private _commentService: CommentService,
    private _commentNotificationService: CommentNotificationService,
    private _sentryService: SentryService
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
      .catch((ex) => {
        this._logger.error(ex, ex.stack);
        this._sentryService.captureException(ex);
      });
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenUpdatedEvent]: ${JSON.stringify(event)}`);

    const { oldComment, commentResponse, actor } = event.payload;

    this._commentNotificationService
      .update(event.getEventName(), actor, oldComment, commentResponse)
      .catch((ex) => {
        this._logger.error(ex, ex.stack);
        this._sentryService.captureException(ex);
      });
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenDeletedEvent]: ${JSON.stringify(event)}`);
    const { comment, actor } = event.payload;

    this._commentNotificationService.destroy(event.getEventName(), comment).catch((ex) => {
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
    });
  }
}
