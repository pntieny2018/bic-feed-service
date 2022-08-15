import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { CommentService } from '../../modules/comment';
import { CommentNotificationService } from '../../notification/services';
import { NIL as NIL_UUID } from 'uuid';
import { SentryService } from '@app/sentry';
import { FeedService } from '../../modules/feed/feed.service';

@Injectable()
export class CommentListener {
  private _logger = new Logger(CommentListener.name);
  public constructor(
    private _commentService: CommentService,
    private _commentNotificationService: CommentNotificationService,
    private _sentryService: SentryService,
    private _feedService: FeedService
  ) {}

  @On(CommentHasBeenCreatedEvent)
  public async onCommentHasBeenCreated(event: CommentHasBeenCreatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenCreatedEvent]: ${JSON.stringify(event)}`);

    const { commentResponse, actor } = event.payload;

    if (commentResponse.parentId !== NIL_UUID) {
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
    this._feedService.markSeenPosts(commentResponse.postId, actor.id).catch((ex) => {
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
