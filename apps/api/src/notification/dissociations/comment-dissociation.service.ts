import { SentryService } from '@libs/infra/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NIL as NIL_UUID } from 'uuid';

import { CommentModel, IComment } from '../../database/models/comment.model';
import { FollowModel } from '../../database/models/follow.model';
import { PostResponseDto } from '../../modules/post/dto/responses';
import { CommentNotFoundException } from '../../modules/v2-post/domain/exception';
import { CommentRecipientDto, ReplyCommentRecipientDto } from '../dto/response';
import { getDatabaseConfig } from '@libs/database/postgres/config';

@Injectable()
export class CommentDissociationService {
  private _logger = new Logger(CommentDissociationService.name);
  public constructor(
    @InjectConnection() private readonly _sequelize: Sequelize,
    @InjectModel(CommentModel) private readonly _commentModel: typeof CommentModel,
    private readonly _sentryService: SentryService
  ) {}

  public async dissociateComment(
    actorId: string,
    commentId: string,
    postResponse: PostResponseDto,
    cb?: (prevComments: IComment[]) => void
  ): Promise<CommentRecipientDto | ReplyCommentRecipientDto> {
    const { schema } = getDatabaseConfig();
    const recipient = CommentRecipientDto.init();
    const groupAudienceIds = postResponse.audience.groups.map((g) => g.id);
    const postMentions = Array.isArray(postResponse.mentions)
      ? []
      : Object.values(postResponse.mentions || {});
    try {
      let comment = await this._commentModel.findOne({
        where: {
          id: commentId,
        },
      });
      if (!comment) {
        throw new CommentNotFoundException();
      }

      comment = comment.toJSON();

      if (comment.parentId && comment.parentId !== NIL_UUID) {
        return this.dissociateReplyComment(actorId, comment, groupAudienceIds);
      }

      /**
       * User who created post
       * Will equal null if post creator comment to self's post
       */
      const postOwnerId = postResponse.actor.id === actorId ? null : postResponse.actor.id;

      /**
       * users who mentioned in post
       */
      const mentionedUsersInPost = postMentions.map((mention) => mention.id);

      /**
       * users who mentioned in created comment
       */
      const mentionedUsersInComment = comment.mentions ?? [];

      let prevCommentsRes = await this._commentModel.findAll({
        where: {
          postId: comment.postId,
          id: {
            [Op.not]: comment.id,
          },
          createdAt: {
            [Op.lte]: Sequelize.literal(
              `(SELECT created_at FROM ${schema}.${CommentModel.tableName} WHERE id = '${comment.id}')`
            ),
          },
        },
        order: [['createdAt', 'DESC']],
        limit: 100,
      });
      if (!prevCommentsRes) {
        prevCommentsRes = [];
      }

      const resultPrevComments = prevCommentsRes.map((c) => c.toJSON());

      const ignoreUserIds = postOwnerId
        ? [...new Set([actorId, postOwnerId, ...mentionedUsersInComment, ...mentionedUsersInPost])]
        : [...new Set([actorId, ...mentionedUsersInComment, ...mentionedUsersInPost])];

      const prevComments = resultPrevComments.filter((pc) => !ignoreUserIds.includes(pc.createdBy));
      /**
       * users who created prev comments
       */
      const actorIdsOfPrevComments = prevComments.map((comment) => comment.createdBy);

      /**
       * users who was checked if users followed group audience
       */
      const checkUserIds = [
        postOwnerId,
        ...mentionedUsersInComment,
        ...actorIdsOfPrevComments,
        ...mentionedUsersInPost,
      ];

      if (!checkUserIds.length) {
        return recipient;
      }
      const validUserIds = await FollowModel.getValidUserIds(
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

      // call back to return prev comments
      if (cb) {
        cb(resultPrevComments);
      }
      return recipient;
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
      return recipient;
    }
  }

  public async dissociateReplyComment(
    actorId: string,
    comment: CommentModel,
    groupAudienceIds: string[]
  ): Promise<ReplyCommentRecipientDto> {
    try {
      const { schema } = getDatabaseConfig();
      const recipient = ReplyCommentRecipientDto.init();

      let parentComment = await this._commentModel.findOne({
        include: [
          {
            model: CommentModel,
            as: 'child',
            required: false,
            where: {
              id: {
                [Op.not]: comment.id,
              },
              createdAt: {
                [Op.lte]: Sequelize.literal(
                  `(SELECT created_at FROM ${schema}.${CommentModel.tableName} WHERE id = '${comment.id}')`
                ),
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
        throw new CommentNotFoundException();
      }
      parentComment = parentComment.toJSON();

      const parentCommentCreatorId =
        parentComment.createdBy === actorId ? null : parentComment.createdBy;

      const mentionedUserIdsInComment = comment.mentions;

      const mentionedUserIdsInParentComment = parentComment.mentions;

      const prevChildCommentCreatorIds = [];

      const mentionedUserIdsInPrevChildComment = [];

      parentComment.child.forEach((comment) => {
        prevChildCommentCreatorIds.push(comment.createdBy);
        mentionedUserIdsInPrevChildComment.push(...comment.mentions);
      });

      const handledUserIds = [];

      const validUserIds = await FollowModel.getValidUserIds(
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
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
      return null;
    }
  }
}
