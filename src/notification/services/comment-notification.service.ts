import { CommentActivityService } from '../activities';
import { CommentDissociationService } from '../dissociations';
import { IComment } from '../../database/models/comment.model';
import { PostService } from '../../modules/post/post.service';
import { NotificationService } from '../notification.service';
import { CommentResponseDto } from '../../modules/comment/dto/response';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationActivity } from '../dto/requests/notification-activity.dto';
import { CommentRecipientDto, ReplyCommentRecipientDto } from '../dto/response';
import { UserDto } from '../../modules/auth';
import { NIL as NIL_UUID } from 'uuid';
import { CommentService } from '../../modules/comment';

@Injectable()
export class CommentNotificationService {
  private _logger = new Logger(CommentNotificationService.name);
  public constructor(
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @Inject(forwardRef(() => CommentService))
    private readonly _commentService: CommentService,
    private readonly _notificationService: NotificationService,
    private _commentActivityService: CommentActivityService,
    private _commentDissociationService: CommentDissociationService
  ) {}

  public async create(
    event: string,
    actor: UserDto,
    commentResponse: CommentResponseDto
  ): Promise<void> {
    let commentActivity;

    const postResponse = await this._postService.get(commentResponse.postId, actor, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    const prevComments: IComment[] = [];
    const prevCommentActivities: NotificationActivity[] = [];

    const recipient = await this._commentDissociationService.dissociateComment(
      commentResponse.actor.id,
      commentResponse.id,
      postResponse,
      (result) => {
        prevComments.push(...result);
      }
    );

    if (commentResponse.parentId !== NIL_UUID) {
      commentActivity = this._commentActivityService.createReplyCommentPayload(
        postResponse,
        commentResponse
      );
    } else {
      commentActivity = this._commentActivityService.createCommentPayload(
        postResponse,
        commentResponse
      );
      if (prevComments.length) {
        const commentResponses = await this._commentService.getCommentsByIds(
          prevComments.map((c) => c.id)
        );
        prevCommentActivities.push(
          ...commentResponses.map((cr) =>
            this._commentActivityService.createCommentPayload(postResponse, cr)
          )
        );
      }
    }

    const recipientObj = {
      commentRecipient: CommentRecipientDto.init(),
      replyCommentRecipient: ReplyCommentRecipientDto.init(),
    };

    if (commentResponse.parentId !== NIL_UUID) {
      recipientObj.replyCommentRecipient = recipient as ReplyCommentRecipientDto;
    } else {
      recipientObj.commentRecipient = recipient as CommentRecipientDto;
    }

    this._notificationService.publishCommentNotification<NotificationActivity>({
      key: `${postResponse.id}`,
      value: {
        actor: commentResponse.actor,
        event: event,
        data: commentActivity,
        meta: {
          comment: {
            ...recipientObj,
            prevCommentActivities,
          },
        },
      },
    });
  }

  public async update(
    event: string,
    actor: UserDto,
    oldComment: IComment,
    commentResponse: CommentResponseDto
  ): Promise<void> {
    const postResponse = await this._postService.get(commentResponse.postId, actor, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    const newMentionedUserIds = Object.values(commentResponse.mentions ?? {}).map((u) => u.id);

    const oldMentionedUserIds = (oldComment.mentions ?? []).map((m) => m.userId);

    const validMentionUserIds = (newMentionedUserIds ?? []).filter(
      (userId) => !(oldMentionedUserIds ?? []).includes(userId)
    );

    let commentActivity;

    if (commentResponse.parentId !== NIL_UUID) {
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

    const recipientObj = {
      commentRecipient: null,
      replyCommentRecipient: null,
    };
    if (commentResponse.parentId !== NIL_UUID) {
      recipientObj.replyCommentRecipient = new ReplyCommentRecipientDto(
        null,
        validMentionUserIds,
        [],
        [],
        []
      );
    } else {
      recipientObj.commentRecipient = new CommentRecipientDto(null, validMentionUserIds, [], []);
    }

    this._notificationService.publishCommentNotification<NotificationActivity>({
      key: `${postResponse.id}`,
      value: {
        actor: commentResponse.actor,
        event: event,
        data: commentActivity,
        ...recipientObj,
      },
    });
  }

  public async destroy(event: string, deletedComment: IComment): Promise<void> {
    this._notificationService.publishCommentNotification<NotificationActivity>({
      key: `${deletedComment.postId}`,
      value: {
        actor: null,
        event: event,
        data: deletedComment as any,
      },
    });
  }
}
