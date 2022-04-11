import { CommentService } from '../../modules/comment';
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
    private _elasticsearchService: ElasticsearchService,
    private _commentService: CommentService
  ) {}

  @On(CommentHasBeenCreatedEvent)
  public async onCommentHasBeenCreated(event: CommentHasBeenCreatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenCreatedEvent]: ${JSON.stringify(event)}`);
    this._notificationService.publishCommentNotification<any>(null);

    const { post } = event.payload;
    this._syncCommentCountToSearch(post.id);
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    this._logger.log(event);
    const { post } = event.payload;
    this._syncCommentCountToSearch(post.id);
    // this._notificationService.publishCommentNotification<any>(null);
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    this._logger.log(event);
    const { post } = event.payload;

    this._syncCommentCountToSearch(post.id);
    // this._notificationService.publishCommentNotification<any>(null);
  }

  private async _syncCommentCountToSearch(postId: number): Promise<void> {
    const index = ElasticsearchHelper.INDEX.POST;
    const commentCount = this._commentService.getCommentCountByPost(postId);
    await this._elasticsearchService.update({
      index,
      id: `${postId}`,
      body: { doc: { commentsCount: commentCount } },
    });
  }
}
