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
import {
  CreatedCommentPayloadDto,
  DeletedCommentPayloadDto,
  UpdatedCommentPayloadDto,
} from '../../notification/dto/requests/comment';

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

    const { post, isReply, commentResponse } = event.payload;

    let relatedParties;
    const mentions = Object.values(commentResponse.mentions).map((u) => u.id);
    if (!isReply) {
      if (!post.mentions) {
        post.mentions = [];
      }

      relatedParties = await this._commentService.getRecipientWhenCreatedCommentForPost(
        commentResponse.actor.id,
        0,
        mentions,
        post
      );
    } else {
      const groupIds = post.groups.map((g) => g.groupId);

      relatedParties = await this._commentService.getRecipientWhenRepliedComment(
        commentResponse.actor.id,
        groupIds,
        commentResponse.parentId,
        mentions
      );
    }
    this._notificationService.publishCommentNotification<CreatedCommentPayloadDto>({
      key: `${post.id}`,
      value: {
        actor: commentResponse.actor,
        event: event.getEventName(),
        data: {
          isReply: isReply,
          post: post,
          comment: commentResponse,
          relatedParties: relatedParties,
        },
      },
    });
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    this._logger.log(event);
    const { post, newComment, oldComment, commentResponse } = event.payload;

    const relatedParties = await this._commentService.getRecipientWhenUpdatedComment(
      oldComment.mentions.map((m) => m.userId),
      newComment.mentions.map((m) => m.userId)
    );

    this._notificationService.publishCommentNotification<UpdatedCommentPayloadDto>({
      key: post.id.toString(),
      value: {
        actor: commentResponse.actor,
        event: event.getEventName(),
        data: {
          post: post,
          comment: commentResponse,
          relatedParties: relatedParties,
        },
      },
    });
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    const { post, comment } = event.payload;

    this._notificationService.publishCommentNotification<DeletedCommentPayloadDto>({
      key: post.id.toString(),
      value: {
        actor: null,
        event: event.getEventName(),
        data: {
          commentId: comment.id,
        },
      },
    });
  }
}
