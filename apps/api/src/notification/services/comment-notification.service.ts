import { NIL as NIL_UUID } from 'uuid';
import { InjectModel } from '@nestjs/sequelize';
import { CommentService } from '../../modules/comment';
import { CommentActivityService } from '../activities';
import { CommentDissociationService } from '../dissociations';
import { IComment } from '../../database/models/comment.model';
import { PostService } from '../../modules/post/post.service';
import { NotificationService } from '../notification.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CommentResponseDto } from '../../modules/comment/dto/response';
import { ReportContentModel } from '../../database/models/report-content.model';
import { CommentRecipientDto, ReplyCommentRecipientDto } from '../dto/response';
import { NotificationActivity } from '../dto/requests/notification-activity.dto';
import { ReportContentDetailModel } from '../../database/models/report-content-detail.model';
import { UserDto } from '../../modules/v2-user/application';
import { CommentEntity } from '../../modules/v2-post/domain/model/comment';

@Injectable()
export class CommentNotificationService {
  public constructor(
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @Inject(forwardRef(() => CommentService))
    private readonly _commentService: CommentService,
    private readonly _notificationService: NotificationService,
    private _commentActivityService: CommentActivityService,
    private _commentDissociationService: CommentDissociationService,
    @InjectModel(ReportContentModel)
    private readonly _reportContentModel: typeof ReportContentModel
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
    if (postResponse.isHidden) {
      return;
    }
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
      const { mentionedUserIdsInComment, mentionedUserIdsInParentComment } =
        recipientObj.replyCommentRecipient;

      recipientObj.replyCommentRecipient.mentionedUserIdsInParentComment = await this._filterUser(
        commentResponse.parentId,
        mentionedUserIdsInParentComment
      );

      recipientObj.replyCommentRecipient.mentionedUserIdsInComment = await this._filterUser(
        postResponse.id,
        mentionedUserIdsInComment
      );
    } else {
      recipientObj.commentRecipient = recipient as CommentRecipientDto;

      const { mentionedUsersInComment, mentionedUsersInPost } = recipientObj.commentRecipient;

      recipientObj.commentRecipient.mentionedUsersInComment = await this._filterUser(
        postResponse.id,
        mentionedUsersInComment
      );

      recipientObj.commentRecipient.mentionedUsersInPost = await this._filterUser(
        postResponse.id,
        mentionedUsersInPost
      );
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
    oldMentions: string[],
    commentResponse: CommentResponseDto
  ): Promise<void> {
    const postResponse = await this._postService.get(commentResponse.postId, actor, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    if (postResponse.isHidden) {
      return;
    }
    const newMentionedUserIds = Object.values(commentResponse.mentions ?? {}).map((u) => u.id);

    const validMentionUserIds = (newMentionedUserIds ?? []).filter(
      (userId) => !(oldMentions ?? []).includes(userId)
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

      recipientObj.commentRecipient.mentionedUsersInComment = await this._filterUser(
        postResponse.id,
        recipientObj.commentRecipient?.mentionedUsersInComment ?? []
      );
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
          },
        },
      },
    });
  }

  public async destroy(event: string, deletedComment: IComment | CommentEntity): Promise<void> {
    let data: any, postId: string;
    if (deletedComment instanceof CommentEntity) {
      data = deletedComment.toObject();
      postId = deletedComment.get('postId');
    } else {
      data = deletedComment;
      postId = deletedComment.postId;
    }
    this._notificationService.publishCommentNotification<NotificationActivity>({
      key: postId,
      value: {
        actor: null,
        event: event,
        data,
      },
    });
  }

  private async _filterUser(targetId: string, userIds: string[]): Promise<string[]> {
    if (!userIds || !userIds?.length) {
      return [];
    }

    const records = await this._reportContentModel.findAll({
      include: [
        {
          model: ReportContentDetailModel,
          as: 'details',
          where: {
            createdBy: userIds,
          },
        },
      ],
      where: {
        targetId: targetId,
      },
    });

    if (!records || !records?.length) {
      return userIds;
    }
    const details = records.map((r) => r.details).flat();

    const reporterIds = [...new Set(details.map((d) => d.createdBy))];

    return userIds.filter((userId) => !reporterIds.includes(userId));
  }
}
