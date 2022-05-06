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

@Injectable()
export class CommentNotificationService {
  private _logger = new Logger(CommentNotificationService.name);
  public constructor(
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    private readonly _notificationService: NotificationService,
    private _commentActivityService: CommentActivityService,
    private _commentDissociationService: CommentDissociationService
  ) {}

  public async create(
    event: string,
    actor: UserDto,
    commentResponse: CommentResponseDto
  ): Promise<void> {
    this._logger.debug(`[create] ${event}: ${JSON.stringify(commentResponse)}`);
    let commentActivity;

    const postResponse = await this._postService.getPost(commentResponse.postId, actor, {
      commentLimit: 0,
      childCommentLimit: 0,
    });
    const groupAudienceIds = postResponse.audience.groups.map((g) => g.id);

    if (commentResponse.parentId) {
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
      commentRecipient: CommentRecipientDto.init(),
      replyCommentRecipient: ReplyCommentRecipientDto.init(),
    };
    if (commentResponse.parentId) {
      recipientObj.replyCommentRecipient = recipient as any;
    } else {
      recipientObj.commentRecipient = recipient as any;
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

  public async update(
    event: string,
    actor: UserDto,
    oldComment: IComment,
    commentResponse: CommentResponseDto
  ): Promise<void> {
    this._logger.debug(
      `[update] ${event}: ${JSON.stringify(oldComment)} :${JSON.stringify(commentResponse)}`
    );

    const postResponse = await this._postService.getPost(commentResponse.postId, actor, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    const newMentionedUserIds = Object.values(commentResponse.mentions ?? {}).map((u) => u.id);

    const oldMentionedUserIds = (oldComment.mentions ?? []).map((m) => m.userId);

    const validMentionUserIds = (newMentionedUserIds ?? []).filter(
      (userId) => !(oldMentionedUserIds ?? []).includes(userId)
    );

    let commentActivity;

    if (commentResponse.parentId) {
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
    if (commentResponse.parentId) {
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
