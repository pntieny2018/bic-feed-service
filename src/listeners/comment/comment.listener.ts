import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../notification';

@Injectable()
export class CommentListener {
  private _logger = new Logger(CommentListener.name);
  public constructor(private _notificationService: NotificationService) {}

  @On(CommentHasBeenCreatedEvent)
  public async onCommentHasBeenCreated(event: CommentHasBeenCreatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenCreatedEvent]: ${JSON.stringify(event)}`);
    this._notificationService.publishCommentNotification<any>(null);
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    this._logger.log(event);
    // this._notificationService.publishCommentNotification<any>(null);
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    this._logger.log(event);
    // this._notificationService.publishCommentNotification<any>(null);
  }
}
