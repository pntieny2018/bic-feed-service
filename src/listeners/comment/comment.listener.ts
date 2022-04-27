import { On } from '../../common/decorators';
import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import {
  DeletedCommentPayloadDto,
  UpdatedCommentPayloadDto,
} from '../../notification/dto/requests/comment';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../notification';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CommentActivityService } from '../../notification/activities';
import { CommentDissociationService } from '../../notification/services';
import { NotificationActivity } from '../../notification/dto/requests/notification-activity.dto';

@Injectable()
export class CommentListener {
  private _logger = new Logger(CommentListener.name);
  public constructor(
    private _notificationService: NotificationService,
    private _elasticsearchService: ElasticsearchService,
    private _commentActivityService: CommentActivityService,
    private _commentDissociationService: CommentDissociationService
  ) {}

  @On(CommentHasBeenCreatedEvent)
  public async onCommentHasBeenCreated(event: CommentHasBeenCreatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenCreatedEvent]: ${JSON.stringify(event)}`);

    const { postResponse, isReply, commentResponse } = event.payload;

    let commentActivity;

    const groupAudienceIds = postResponse.audience.groups.map((g) => g.id);

    if (isReply) {
      commentActivity = this._commentActivityService.createReplyCommentPayload(
        postResponse,
        commentResponse
      );
    } else {
      commentActivity = this._commentActivityService.createCommentPayload(
        postResponse,
        commentResponse
      );
    }
    const recipient = await this._commentDissociationService.dissociateComment(
      commentResponse.actor.id,
      commentResponse.id,
      groupAudienceIds
    );
    const recipientObj = {
      commentRecipient: null,
      replyCommentRecipient: null,
    };
    if (isReply) {
      recipientObj.replyCommentRecipient = recipient;
    } else {
      recipientObj.commentRecipient = recipient;
    }

    this._notificationService.publishCommentNotification<NotificationActivity>({
      key: `${postResponse.id}`,
      value: {
        actor: commentResponse.actor,
        event: event.getEventName(),
        data: commentActivity,
        ...recipientObj,
      } as any,
    });
  }

  @On(CommentHasBeenUpdatedEvent)
  public async onCommentHasBeenUpdated(event: CommentHasBeenUpdatedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenUpdatedEvent]: ${JSON.stringify(event)}`);
    const { post, newComment, oldComment, commentResponse } = event.payload;

    this._notificationService.publishCommentNotification<UpdatedCommentPayloadDto>({
      key: `${post.id}`,
      value: {
        actor: commentResponse.actor,
        event: event.getEventName(),
        data: {
          post: post,
          comment: commentResponse,
          relatedParties: null,
        },
      },
    });
  }

  @On(CommentHasBeenDeletedEvent)
  public async onCommentHasBeenDeleted(event: CommentHasBeenDeletedEvent): Promise<void> {
    this._logger.debug(`[CommentHasBeenDeletedEvent]: ${JSON.stringify(event)}`);
    const { post, comment } = event.payload;

    this._notificationService.publishCommentNotification<DeletedCommentPayloadDto>({
      key: `${post.id}`,
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
