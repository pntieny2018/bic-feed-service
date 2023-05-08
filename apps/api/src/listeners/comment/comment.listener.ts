import { SentryService } from '@app/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { NIL as NIL_UUID } from 'uuid';
import { On } from '../../common/decorators';
import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { CommentService } from '../../modules/comment';
import { CommentNotificationService } from '../../notification/services';
import { PostService } from '../../modules/post/post.service';

@Injectable()
export class CommentListener {
  private _logger = new Logger(CommentListener.name);
  public constructor(
    private _commentService: CommentService,
    private _commentNotificationService: CommentNotificationService,
    private _sentryService: SentryService,
    private _postService: PostService
  ) {}

  @On(CommentHasBeenCreatedEvent)
  public async onCommentHasBeenCreated(event: CommentHasBeenCreatedEvent): Promise<void> {
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
        this._logger.error(JSON.stringify(ex?.stack));
        this._sentryService.captureException(ex);
      });

    this._postService.markSeenPost(commentResponse.postId, actor.id).catch((ex) => {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
    });
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    const { oldComment, commentResponse, actor } = event.payload;
    if (commentResponse.parentId !== NIL_UUID) {
      commentResponse.parent = await this._commentService.getComment(
        actor,
        commentResponse.parentId,
        0
      );
    }
    this._commentNotificationService
      .update(event.getEventName(), actor, oldComment, commentResponse)
      .catch((ex) => {
        this._logger.error(JSON.stringify(ex?.stack));
        this._sentryService.captureException(ex);
      });
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    const { comment } = event.payload;

    this._commentNotificationService.destroy(event.getEventName(), comment).catch((ex) => {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
    });
  }
}
