import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { On } from '../../common/decorators';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../notification';
import { ElasticsearchHelper } from '../../common/helpers';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class CommentListener {
  private _logger = new Logger(CommentListener.name);
  public constructor(
    private _notificationService: NotificationService,
    private _elasticsearchService: ElasticsearchService
  ) {}

  @On(CommentHasBeenCreatedEvent)
  public async onCommentHasBeenCreated(event: CommentHasBeenCreatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenCreatedEvent]: ${JSON.stringify(event)}`);
    this._notificationService.publishCommentNotification<any>(null);

    const index = ElasticsearchHelper.INDEX.POST;
    const { post } = event.payload;
    try {
      const dataUpdate = {
        commentsCount: post.commentsCount + 1,
      };
      await this._elasticsearchService.update({
        index,
        id: `${post.id}`,
        body: { doc: dataUpdate },
      });
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    this._logger.log(event);
    // this._notificationService.publishCommentNotification<any>(null);
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    this._logger.log(event);
    const index = ElasticsearchHelper.INDEX.POST;
    const { post } = event.payload;
    try {
      const dataUpdate = {
        commentsCount: post.commentsCount - 1,
      };
      await this._elasticsearchService.update({
        index,
        id: `${post.id}`,
        body: { doc: dataUpdate },
      });
    } catch (error) {
      this._logger.error(error, error?.stack);
    }
    // this._notificationService.publishCommentNotification<any>(null);
  }
}
