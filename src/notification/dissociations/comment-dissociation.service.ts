import { Op } from 'sequelize';
import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { ExceptionHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { PostModel } from '../../database/models/post.model';
import { FollowModel } from '../../database/models/follow.model';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../../database/models/comment.model';
import { MentionModel } from '../../database/models/mention.model';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { CommentRecipientDto, ReplyCommentRecipientDto } from '../dto/response';
import { NIL as NIL_UUID } from 'uuid';

@Injectable()
export class CommentDissociationService {
  private _logger = new Logger(CommentDissociationService.name);
  public constructor(
    @InjectConnection() private readonly _sequelize: Sequelize,
    @InjectModel(CommentModel) private readonly _commentModel: typeof CommentModel
  ) {}

  public async dissociateComment(
    actorId: number,
    commentId: string,
    groupAudienceIds: number[]
  ): Promise<CommentRecipientDto | ReplyCommentRecipientDto> {
    const recipient = CommentRecipientDto.init();

    try {
      let comment = await this._commentModel.findOne({
        include: [
          {
            model: PostModel,
            as: 'post',
            attributes: ['createdBy'],
          },
          {
            association: 'mentions',
            required: false,
            where: {
              mentionableType: MentionableType.COMMENT,
            },
          },
        ],
        where: {
          id: commentId,
        },
      });
      if (!comment) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
      }

      comment = comment.toJSON();

      if (!comment.post) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_EXISTING);
      }

      if (comment.parentId !== NIL_UUID) {
        return this.dissociateReplyComment(actorId, comment, groupAudienceIds);
      }

      /**
       * User who created post
       * Will equal null if post creator comment to self's post
       */
      const postOwnerId = comment.post.createdBy === actorId ? null : comment.post.createdBy;

      /**
       * users who mentioned in post
       */
      const mentionedUsersInPost = (comment.post.mentions ?? []).map((mention) => mention.userId);

      /**
       * users who mentioned in created comment
       */
      const mentionedUsersInComment = (comment.mentions ?? []).map((m) => m.userId);

      let prevComments = await this._commentModel.findAll({
        where: {
          postId: comment.postId,
          id: {
            [Op.lt]: commentId,
          },
          createdBy: {
            [Op.notIn]: postOwnerId
              ? [
                  ...new Set([
                    actorId,
                    postOwnerId,
                    ...mentionedUsersInComment,
                    ...mentionedUsersInPost,
                  ]),
                ]
              : [...new Set([actorId, ...mentionedUsersInComment, ...mentionedUsersInPost])],
          },
        },
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
      if (!prevComments) {
        prevComments = [];
      }

      /**
       * users who created prev comments
       */
      const actorIdsOfPrevComments = prevComments.map((comment) => comment.createdBy);

      /**
       * users who was checked if users followed group audience
       */
      const checkUserIds = [postOwnerId, ...mentionedUsersInComment, ...actorIdsOfPrevComments];

      if (!checkUserIds.length) {
        return recipient;
      }

      const validUserIds = await this.getValidUserIds(
        [...new Set(checkUserIds)].filter((id) => id),
        groupAudienceIds
      );
      /**
       * priority:
       *        1. mentioned you in a comment.
       *        2. commented on your post.
       *        3. commented to a post you're mentioned.
       *        4. also commented on a post.
       */

      const handledUserIds = [];
      for (const validUserId of validUserIds) {
        if (!handledUserIds.includes(validUserId)) {
          if (mentionedUsersInComment.includes(validUserId)) {
            recipient.mentionedUsersInComment.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }

          if (validUserId === postOwnerId && postOwnerId !== null) {
            recipient.postOwnerId = validUserId;
            handledUserIds.push(validUserId);
            continue;
          }

          if (mentionedUsersInPost.includes(validUserId)) {
            recipient.mentionedUsersInPost.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }
          if (actorIdsOfPrevComments.includes(validUserId)) {
            recipient.actorIdsOfPrevComments.push(validUserId);
            handledUserIds.push(validUserId);
          }
        }
      }
      return recipient;
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      return recipient;
    }
  }

  public async dissociateReplyComment(
    actorId: number,
    comment: CommentModel,
    groupAudienceIds: number[]
  ): Promise<ReplyCommentRecipientDto> {
    try {
      const recipient = ReplyCommentRecipientDto.init();

      const parentComment = await this._commentModel.findOne({
        include: [
          {
            model: MentionModel,
            as: 'mentions',
          },
          {
            model: CommentModel,
            as: 'child',
            include: [
              {
                model: MentionModel,
                as: 'mentions',
              },
            ],
            where: {
              id: {
                [Op.lt]: comment.id,
              },
            },
            limit: 100,
            order: [['createdAt', 'DESC']],
          },
        ],
        where: {
          id: comment.parentId,
        },
      });

      if (!parentComment) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
      }

      const parentCommentCreatorId =
        parentComment.createdBy === actorId ? null : parentComment.createdBy;

      const mentionedUserIdsInComment = comment.mentions.map((m) => m.userId);

      const mentionedUserIdsInParentComment = parentComment.mentions.map((m) => m.userId);

      const prevChildCommentCreatorIds = [];

      const mentionedUserIdsInPrevChildComment = [];

      parentComment.child.forEach((comment) => {
        prevChildCommentCreatorIds.push(comment.createdBy);
        mentionedUserIdsInPrevChildComment.push(...comment.mentions.map((m) => m.userId));
      });

      const handledUserIds = [];

      const validUserIds = await this.getValidUserIds(
        [
          ...new Set([
            parentCommentCreatorId,
            ...mentionedUserIdsInComment,
            ...mentionedUserIdsInParentComment,
            ...prevChildCommentCreatorIds,
            ...mentionedUserIdsInPrevChildComment,
          ]),
        ].filter((id) => id),
        groupAudienceIds
      );

      /**
       * priority:
       *        1. mentioned you in a comment.
       *        2. replied your comment.
       *        3. replied on a comment you are mentioned. (mentioned user in prev reply comment)
       *        4. also replied on a comment you are replied.
       *        5. replied on a comment you are mentioned. (mentioned user in parent comment)
       */

      for (const validUserId of validUserIds.filter((id) => id !== actorId)) {
        if (!handledUserIds.includes(validUserId)) {
          if (mentionedUserIdsInComment.includes(validUserId)) {
            recipient.mentionedUserIdsInComment.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }

          if (parentCommentCreatorId === validUserId && parentCommentCreatorId !== null) {
            recipient.parentCommentCreatorId = validUserId;
            handledUserIds.push(validUserId);
            continue;
          }

          if (mentionedUserIdsInPrevChildComment.includes(validUserId)) {
            recipient.mentionedUserIdsInPrevChildComment.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }
          if (mentionedUserIdsInParentComment.includes(validUserId)) {
            recipient.mentionedUserIdsInParentComment.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }
          if (prevChildCommentCreatorIds.includes(validUserId)) {
            recipient.prevChildCommentCreatorIds.push(validUserId);
            handledUserIds.push(validUserId);
          }
        }
      }
      return recipient;
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      return null;
    }
  }

  public async getValidUserIds(userIds: number[], groupIds: number[]): Promise<number[]> {
    const { schema } = getDatabaseConfig();

    const rows = await this._sequelize.query(
      ` WITH REMOVE_DUPLICATE(id,user_id,duplicate_count) AS ( 
                   SELECT id,user_id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY id ASC) 
                   AS duplicate_count
                   FROM ${schema}.${FollowModel.tableName} 
                   WHERE group_id IN  (${groupIds.join(',')})  
              ) SELECT user_id FROM REMOVE_DUPLICATE tb1 
                WHERE duplicate_count = 1 
                AND user_id IN  (${userIds.join(',')})  
             `
    );
    if (!rows) {
      return [];
    }

    return rows[0].map((r) => r['user_id']);
  }
}
