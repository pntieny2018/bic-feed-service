import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';

import { Op, QueryTypes, Transaction } from 'sequelize';
import { UserDto } from '../auth';
import { PostAllow } from '../post';
import { MediaService } from '../media';
import { OrderEnum, PageDto } from '../../common/dto';
import { MentionService } from '../mention';
import { UserService } from '../../shared/user';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { CommentEditedHistoryDto, CommentResponseDto } from './dto/response';
import { EntityType } from '../media/media.constants';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { UserDataShareDto } from '../../shared/user/dto';
import { MediaModel } from '../../database/models/media.model';
import { PostPolicyService } from '../post/post-policy.service';
import { CreateCommentDto, GetCommentEditedHistoryDto } from './dto/requests';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { IPost, PostModel } from '../../database/models/post.model';
import { ExceptionHelper } from '../../common/helpers';
import { CommonReactionService, DeleteReactionService } from '../reaction/services';
import { getDatabaseConfig } from '../../config/database';
import { FollowModel } from '../../database/models/follow.model';
import { FollowService } from '../follow';
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PostGroupModel } from '../../database/models/post-group.model';
import { CommentEditedHistoryModel } from '../../database/models/comment-edited-history.model';
import { CommentDetailResponseDto } from './dto/response/comment-detail.response.dto';
import sequelize from 'sequelize';
import { GetCommentsDto } from './dto/requests/get-comments.dto';
import { GetCommentLinkDto } from './dto/requests/get-comment-link.dto';

@Injectable()
export class CommentService {
  private _logger = new Logger(CommentService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(forwardRef(() => PostService))
    private _postService: PostService,
    private _userService: UserService,
    private _mediaService: MediaService,
    private _mentionService: MentionService,
    private _authorityService: AuthorityService,
    private _postPolicyService: PostPolicyService,
    private _commonReactionService: CommonReactionService,
    private _deleteReactionService: DeleteReactionService,
    private _eventEmitter: InternalEventEmitterService,
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _followService: FollowService,
    @InjectModel(CommentEditedHistoryModel)
    private readonly _commentEditedHistoryModel: typeof CommentEditedHistoryModel
  ) {}

  /**
   * Create new comment
   * @param user UserDto
   * @param createCommentDto CreateCommentDto
   * @param replyId Number
   * @return Promise resolve CommentResponseDto
   */
  public async create(
    user: UserDto,
    createCommentDto: CreateCommentDto,
    replyId = 0
  ): Promise<CommentResponseDto> {
    this._logger.debug(
      `[create] user: ${JSON.stringify(user)}, createCommentDto: ${JSON.stringify(
        createCommentDto
      )},replyId: ${replyId} `
    );

    let post;
    let isReply = false;
    if (replyId > 0) {
      isReply = true;
      const parentComment = await this._commentModel.findOne({
        include: [
          {
            model: PostModel,
            as: 'post',
            include: [
              {
                model: PostGroupModel,
                as: 'groups',
              },
            ],
          },
          {
            model: MentionModel,
            as: 'mentions',
          },
        ],
        where: {
          id: replyId,
          parentId: 0,
        },
      });
      if (!parentComment) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_REPLY_EXISTING);
      }
      if (!parentComment.post) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_EXISTING);
      }

      post = parentComment.toJSON().post;
    } else {
      post = await this._postService.findPost({
        postId: createCommentDto.postId,
      });
    }

    // check user can access
    this._authorityService.allowAccess(user, post);

    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    //HOTFIX: hot fix create comment with image
    const comment = await this._commentModel.create({
      createdBy: user.id,
      updatedBy: user.id,
      parentId: replyId,
      content: createCommentDto.content,
      postId: post.id,
    });

    const transaction = await this._sequelizeConnection.transaction();
    try {
      const userMentionIds = createCommentDto.mentions;

      if (userMentionIds.length) {
        const groupAudienceIds = post.groups.map((g) => g.groupId);

        await this._mentionService.checkValidMentions(groupAudienceIds, userMentionIds);

        await this._mentionService.create(
          userMentionIds.map((userId) => ({
            entityId: comment.id,
            userId,
            mentionableType: MentionableType.COMMENT,
          })),
          transaction
        );
      }
      const media = [
        ...createCommentDto.media.files,
        ...createCommentDto.media.images,
        ...createCommentDto.media.videos,
      ];

      if (media.length) {
        const mediaIds = media.map((m) => m.id);

        await this._mediaService.checkValidMedia(mediaIds, user.id);

        await this._mediaService.sync(comment.id, EntityType.COMMENT, mediaIds, transaction);
      }

      await transaction.commit();

      const commentResponse = await this.getComment(user, comment.id);

      this._eventEmitter.emit(
        new CommentHasBeenCreatedEvent({
          isReply: isReply,
          post: post,
          commentResponse: commentResponse,
        })
      );

      return commentResponse;
    } catch (ex) {
      await transaction.rollback();
      await comment.destroy();
      throw ex;
    }
  }

  /**
   * Update comment
   * @param user UserDto
   * @param commentId Number
   * @param updateCommentDto UpdateCommentDto
   * @return Promise resolve CommentResponseDto
   */
  public async update(
    user: UserDto,
    commentId: number,
    updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug(
      `[update] user: ${JSON.stringify(user)}, updateCommentDto: ${JSON.stringify(
        updateCommentDto
      )},commentId: ${commentId} `
    );

    const comment = await this._commentModel.findOne({
      where: {
        id: commentId,
        createdBy: user.id,
      },
    });

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const oldCommentResponse = await this.getComment(user, commentId);

    const post = await this._postService.findPost({
      postId: comment.postId,
    });

    // check user can access
    this._authorityService.allowAccess(user, post);

    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    const oldComment = comment.toJSON();

    const transaction = await this._sequelizeConnection.transaction();

    try {
      await comment.update(
        {
          updatedBy: user.id,
          content: updateCommentDto.content,
        },
        {
          transaction: transaction,
        }
      );
      const userMentionIds = updateCommentDto.mentions;

      if (userMentionIds.length) {
        const groupAudienceIds = post.groups.map((g) => g.groupId);
        await this._mentionService.checkValidMentions(groupAudienceIds, userMentionIds);
      }
      await this._mentionService.setMention(
        userMentionIds,
        MentionableType.COMMENT,
        comment.id,
        transaction
      );

      const media = [
        ...updateCommentDto.media.files,
        ...updateCommentDto.media.images,
        ...updateCommentDto.media.videos,
      ];

      const mediaIds = media.map((m) => m.id);
      if (mediaIds.length) {
        await this._mediaService.checkValidMedia(mediaIds, user.id);
      }
      await this._mediaService.sync(comment.id, EntityType.COMMENT, mediaIds, transaction);

      await transaction.commit();

      const commentResponse = await this.getComment(user, commentId);

      this._eventEmitter.emit(
        new CommentHasBeenUpdatedEvent({
          newComment: comment.toJSON(),
          oldComment: oldComment,
          post: post,
          commentResponse: commentResponse,
          oldCommentResponse: oldCommentResponse,
        })
      );

      return commentResponse;
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      await transaction.rollback();
      throw ex;
    }
  }

  /**
   * Get single comment
   * @param user UserDto
   * @param commentId Number
   * @param childLimit Number
   * @returns Promise resolve CommentResponseDto
   */
  public async getComment(
    user: UserDto,
    commentId: number,
    childLimit = 25
  ): Promise<CommentResponseDto> {
    this._logger.debug(`[getComment] commentId: ${commentId} `);

    const response = await this._commentModel.findOne({
      where: {
        id: commentId,
      },
      attributes: {
        include: [CommentModel.loadReactionsCount()],
      },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          as: 'mentions',
          required: false,
        },
        {
          model: CommentModel,
          limit: childLimit,
          required: false,
          attributes: {
            include: [CommentModel.loadReactionsCount()],
          },
          include: [
            {
              model: MediaModel,
              through: {
                attributes: [],
              },
              required: false,
            },
            {
              model: MentionModel,
              as: 'mentions',
              required: false,
            },
          ],
        },
        {
          model: CommentReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: user.id,
          },
        },
      ],
    });

    if (!response) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const rawComment = response.toJSON();

    await this._mentionService.bindMentionsToComment([rawComment]);

    await this.bindUserToComment([rawComment]);

    return this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get comment list
   * @param user UserDto
   * @param getCommentsDto GetCommentsDto
   * @param checkAccess Boolean
   * @returns Promise resolve PageDto<CommentResponseDto>
   */
  public async getComments(
    user: UserDto,
    getCommentsDto: GetCommentsDto,
    checkAccess = true
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug(
      `[getComments] user: ${JSON.stringify(user)}, getCommentDto: ${JSON.stringify(
        getCommentsDto
      )}`
    );
    const { limit, childLimit, postId, childOrder, order } = getCommentsDto;

    if (checkAccess) {
      const post = await this._postService.findPost({
        postId,
      });

      await this._authorityService.allowAccess(user, post);
    }

    const conditions = await this._getCondition(getCommentsDto);
    const rows = await this._commentModel.findAll({
      where: {
        ...conditions,
      },
      attributes: {
        include: [],
      },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
        {
          model: CommentModel,
          limit: childLimit,
          required: false,
          attributes: {
            include: [],
          },
          include: [
            {
              model: MediaModel,
              through: {
                attributes: [],
              },
              required: false,
            },
            {
              model: MentionModel,
              as: 'mentions',
              required: false,
            },
            {
              model: CommentReactionModel,
              as: 'ownerReactions',
              required: false,
              where: {
                createdBy: user.id,
              },
            },
          ],
          order: [['createdAt', 'DESC']],
        },
        {
          model: CommentReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: user.id,
          },
        },
      ],
      offset: 0,
      limit: limit + 1,
      order: [['createdAt', 'DESC']],
    });
    const response = rows.map((r) => r.toJSON());

    const hasNextPage = response.length === limit + 1 ? true : false;
    if (hasNextPage) response.pop();

    await Promise.all([
      this._mentionService.bindMentionsToComment(response),
      this._commonReactionService.bindReactionToComments(response),
      this.bindUserToComment(response),
    ]);

    const comments = this._classTransformer.plainToInstance(CommentResponseDto, response, {
      excludeExtraneousValues: true,
    });

    return new PageDto<CommentResponseDto>(comments, {
      limit,
      offset: 0,
      hasNextPage,
    });
  }

  /**
   * Get comment list
   * @param user UserDto
   * @param getCommentsDto GetCommentsDto
   * @param checkAccess Boolean
   * @returns Promise resolve PageDto<CommentResponseDto>
   */
  public async getCommentLinkForWeb(
    commentId: number,
    user: UserDto,
    getCommentLinkDto: GetCommentLinkDto,
    checkAccess = true
  ): Promise<any> {
    this._logger.debug(
      `[getComments] user: ${JSON.stringify(user)}, getCommentDto: ${JSON.stringify(
        getCommentLinkDto
      )}`
    );
    const { limit, targetChildLimit, childLimit } = getCommentLinkDto;

    const checkComment = await this._commentModel.findByPk(commentId);
    if (!checkComment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_FOUND);
    }
    const { postId } = checkComment;
    if (checkAccess) {
      const post = await this._postService.findPost({
        postId,
      });
      await this._authorityService.allowAccess(user, post);
    }
    const parentId = checkComment.parentId > 0 ? checkComment.parentId : commentId;
    const comments = await this._getComments(
      user.id,
      {
        limit,
        postId,
      },
      parentId
    );
    if (comments.list.length && limit > 1) {
      await this.bindChildsToComment(comments.list, user.id, childLimit);
    }
    const aroundChildId = checkComment.parentId > 0 ? commentId : 0;
    const child = await this._getComments(
      user.id,
      {
        limit: targetChildLimit,
        parentId,
        postId,
      },
      aroundChildId
    );
    comments.list.map((cm) => {
      if (cm.id == parentId) {
        cm.child = child;
      }
      return cm;
    });
    return comments;
  }

  private async _getCondition(getCommentsDto: GetCommentsDto): Promise<any> {
    const { schema } = getDatabaseConfig();
    const conditions = {};
    const { postId, parentId, idGT, idGTE, idLT, idLTE } = getCommentsDto;

    conditions['postId'] = postId;

    conditions['parentId'] = parentId ?? 0;
    if (idGT) {
      conditions['id'] = {
        [Op.not]: idGT,
        ...conditions['id'],
      };
      conditions['createdAt'] = {
        [Op.gte]: sequelize.literal(
          `(SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${this._sequelizeConnection.escape(
            idGT
          )})`
        ),
        ...conditions['createdAt'],
      };
    }
    if (idGTE) {
      conditions['createdAt'] = {
        [Op.gte]: sequelize.literal(
          `(SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${this._sequelizeConnection.escape(
            idGTE
          )})`
        ),
        ...conditions['createdAt'],
      };
    }
    if (idLT) {
      conditions['id'] = {
        [Op.not]: idLT,
        ...conditions['id'],
      };
      conditions['createdAt'] = {
        [Op.lte]: sequelize.literal(
          `(SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${this._sequelizeConnection.escape(
            idLT
          )})`
        ),
        ...conditions['createdAt'],
      };
    }
    if (idLTE) {
      conditions['createdAt'] = {
        [Op.lte]: sequelize.literal(
          `(SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${this._sequelizeConnection.escape(
            idLTE
          )})`
        ),
        ...conditions['createdAt'],
      };
    }
    return conditions;
  }

  private async _getComments(
    authUserId: number,
    getCommentsDto: GetCommentsDto,
    aroundId = 0
  ): Promise<PageDto<CommentResponseDto>> {
    const { limit, parentId, postId } = getCommentsDto;
    const order = 'DESC';
    const { schema } = getDatabaseConfig();
    let query: string;
    let condition = ' "c".parent_id = :parentId';
    if (postId) {
      condition += ` AND "c".post_id = :postId`;
    }
    if (aroundId === 0) {
      query = ` SELECT "CommentModel".*,
      "media"."id" AS "mediaId",
      "media"."url" AS "mediaUrl", 
      "media"."type" AS "mediaType",
      "media"."name" AS "mediaName",
      "media"."width" AS "mediaWidth", 
      "media"."height" AS "mediaHeight", 
      "media"."extension" AS "mediaExtension",
      "mentions"."user_id" AS "mentionUserId", 
      "ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"
      FROM (
        SELECT 
        "c"."id",
        "c"."parent_id" AS "parentId", 
        "c"."post_id" AS "postId",
        "c"."content", 
        "c"."total_reply" AS "totalReply", 
        "c"."created_by" AS "createdBy", 
        "c"."updated_by" AS "updatedBy", 
        "c"."created_at" AS "createdAt", 
        "c"."updated_at" AS "updatedAt"
        FROM ${schema}."comments" AS "c"
        WHERE ${condition} 
        ORDER BY "c"."created_at" ${order}
        OFFSET 0 LIMIT :limitTop
      ) AS "CommentModel" 
      LEFT OUTER JOIN ( 
        ${schema}."comments_media" AS "media->CommentMediaModel" 
       INNER JOIN ${schema}."media" AS "media" ON "media"."id" = "media->CommentMediaModel"."media_id"
      ) ON "CommentModel"."id" = "media->CommentMediaModel"."comment_id" 
      LEFT OUTER JOIN ${schema}."mentions" AS "mentions" ON "CommentModel"."id" = "mentions"."entity_id" AND (
        "mentions"."mentionable_type" = 'comment' AND "mentions"."mentionable_type" = 'comment'
      ) 
      LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" AND "ownerReactions"."created_by" = :authUserId 
      ORDER BY "CommentModel"."createdAt" ${order}`;
    } else {
      query = ` SELECT "CommentModel".*,
      "media"."id" AS "mediaId",
      "media"."url" AS "mediaUrl", 
      "media"."type" AS "mediaType",
      "media"."name" AS "mediaName",
      "media"."width" AS "mediaWidth", 
      "media"."height" AS "mediaHeight", 
      "media"."extension" AS "mediaExtension",
      "mentions"."user_id" AS "mentionUserId", 
      "ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"
      FROM (
        (
          SELECT "c"."id", 
                "c"."parent_id" AS "parentId", 
                "c"."post_id" AS "postId",
                "c"."content", 
                "c"."total_reply" AS "totalReply", 
                "c"."created_by" AS "createdBy", 
                "c"."updated_by" AS "updatedBy", 
                "c"."created_at" AS "createdAt", 
                "c"."updated_at" AS "updatedAt"
        FROM ${schema}."comments" AS "c"
        WHERE ${condition} AND "c".created_at <= ( SELECT "c1"."created_at" FROM ${schema}."comments" AS "c1" WHERE "c1".id = :aroundId)
        ORDER BY "c"."created_at" DESC
        OFFSET 0 LIMIT :limitTop
        )
        UNION ALL 
        (
          SELECT "c"."id", 
                  "c"."parent_id" AS "parentId", 
                  "c"."post_id" AS "postId",
                  "c"."content", 
                  "c"."total_reply" AS "totalReply", 
                  "c"."created_by" AS "createdBy", 
                  "c"."updated_by" AS "updatedBy", 
                  "c"."created_at" AS "createdAt", 
                  "c"."updated_at" AS "updatedAt"
          FROM ${schema}."comments" AS "c"
          WHERE ${condition} AND "c".created_at > ( SELECT "c1"."created_at" FROM ${schema}."comments" AS "c1" WHERE "c1".id = :aroundId)
          ORDER BY "c"."created_at" ASC
          OFFSET 0 LIMIT :limitBottom
        )
      ) AS "CommentModel" 
      LEFT OUTER JOIN ( 
        ${schema}."comments_media" AS "media->CommentMediaModel" 
       INNER JOIN ${schema}."media" AS "media" ON "media"."id" = "media->CommentMediaModel"."media_id"
      ) ON "CommentModel"."id" = "media->CommentMediaModel"."comment_id" 
      LEFT OUTER JOIN ${schema}."mentions" AS "mentions" ON "CommentModel"."id" = "mentions"."entity_id" AND (
        "mentions"."mentionable_type" = 'comment' AND "mentions"."mentionable_type" = 'comment'
      )
      LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" AND "ownerReactions"."created_by" = :authUserId 
      ORDER BY "CommentModel"."createdAt" ${order}`;
    }
    const rows: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        parentId: parentId ?? 0,
        postId,
        aroundId,
        authUserId,
        limitTop: limit + 1,
        limitBottom: limit,
      },
      type: QueryTypes.SELECT,
    });
    const childGrouped = this._groupComments(rows);
    let hasNextPage = false;
    let hasPreviousPage = false;
    let commentsFiltered = [];
    if (aroundId > 0) {
      const index = childGrouped.findIndex((i) => i.id === aroundId);
      const n = Math.min(limit, childGrouped.length);
      const start = Math.max(0, index + 1 - Math.round(n / 2));
      commentsFiltered = childGrouped.slice(start, start + n);
      hasPreviousPage = start >= 1 ? true : false;
      hasNextPage = childGrouped[start + n] ? true : false;
    } else {
      hasNextPage = childGrouped.length === limit + 1 ? true : false;
      if (hasNextPage) childGrouped.pop();
      commentsFiltered = childGrouped;
    }
    await Promise.all([
      this._commonReactionService.bindReactionToComments(commentsFiltered),
      this._mentionService.bindMentionsToComment(commentsFiltered),
      this.bindUserToComment(commentsFiltered),
    ]);

    const result = this._classTransformer.plainToInstance(CommentResponseDto, commentsFiltered, {
      excludeExtraneousValues: true,
    });
    return new PageDto<CommentResponseDto>(result, {
      limit,
      offset: 0,
      hasNextPage,
      hasPreviousPage,
    });
  }

  /**
   * Delete single comment
   * @param user UserDto
   * @param commentId Number
   * @returns Promise resolve boolean
   */
  public async destroy(user: UserDto, commentId: number): Promise<boolean> {
    this._logger.debug(`[destroy] user: ${JSON.stringify(user)}, commentID: ${commentId}`);

    const comment = await this._commentModel.findOne({
      where: {
        id: commentId,
        createdBy: user.id,
      },
    });
    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const post = await this._postService.findPost({
      commentId: commentId,
    });
    await this._authorityService.allowAccess(user, post);

    const transaction = await this._sequelizeConnection.transaction();

    try {
      await Promise.all([
        this._mediaService.sync(commentId, EntityType.COMMENT, [], transaction),

        this._mentionService.destroy(
          {
            commentId: commentId,
          },
          transaction
        ),

        this._deleteReactionService.deleteReactionByCommentIds([commentId], transaction),
      ]);

      await this._commentModel.destroy({
        where: {
          parentId: comment.id,
        },
        individualHooks: true,
        transaction: transaction,
      });

      await comment.destroy({ transaction });

      await transaction.commit();

      this._eventEmitter.emit(
        new CommentHasBeenDeletedEvent({
          comment: comment.toJSON(),
          post: post,
        })
      );

      return true;
    } catch (e) {
      this._logger.error(e, e.stack);
      await transaction.rollback();
    }
  }

  /**
   * Bind user info to comment list
   * @param commentsResponse  Array<IComment>
   * @returns Promise resolve void
   */
  public async bindUserToComment(commentsResponse: IComment[]): Promise<void> {
    const actorIds: number[] = [];

    for (const comment of commentsResponse) {
      actorIds.push(comment.createdBy);
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          actorIds.push(cm.createdBy);
        }
      }
    }

    const usersInfo = await this._userService.getMany(actorIds);
    const actorsInfo = plainToInstance(UserDataShareDto, usersInfo, {
      excludeExtraneousValues: true,
    });

    for (const comment of commentsResponse) {
      comment.actor = actorsInfo.find((u) => u.id === comment.createdBy);
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          cm.actor = actorsInfo.find((u) => u.id === cm.createdBy);
        }
      }
    }
  }

  /**
   * Bind user info to comment list
   * @param commentsResponse  Array<IComment>
   * @returns Promise resolve void
   */
  public async bindChildsToComment(comments: any[], authUserId: number, limit = 10): Promise<void> {
    const subQuery = [];
    for (const comment of comments) {
      subQuery.push(`SELECT * 
      FROM (
        SELECT 
              "id", 
              "parent_id" AS "parentId", 
              "post_id" AS "postId", 
              "content", 
              "total_reply" AS "totalReply", 
              "created_by" AS "createdBy", 
              "updated_by" AS "updatedBy", 
              "created_at" AS "createdAt", 
              "updated_at" AS "updatedAt" 
        FROM "feed_abcd"."comments" AS "CommentModel" 
        WHERE "CommentModel"."parent_id" = ${comment.id} 
        ORDER BY "CommentModel"."created_at" DESC LIMIT :limit
      ) AS sub`);
    }

    const query = `SELECT 
      "CommentModel".*,
      "media"."id" AS "mediaId",
      "media"."url" AS "mediaUrl", 
      "media"."type" AS "mediaType",
      "media"."name" AS "mediaName",
      "media"."width" AS "mediaWidth", 
      "media"."height" AS "mediaHeight", 
      "media"."extension" AS "mediaExtension",
      "mentions"."user_id" AS "mentionUserId", 
      "ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"
    FROM (${subQuery.join(' UNION ALL ')}) AS "CommentModel" 
    LEFT OUTER JOIN ( 
      "feed_abcd"."comments_media" AS "media->CommentMediaModel" 
      INNER JOIN "feed_abcd"."media" AS "media" ON "media"."id" = "media->CommentMediaModel"."media_id"
    ) ON "CommentModel"."id" = "media->CommentMediaModel"."comment_id" 
    LEFT OUTER JOIN "feed_abcd"."mentions" AS "mentions" ON "CommentModel"."id" = "mentions"."entity_id" 
        AND ("mentions"."mentionable_type" = 'comment' AND "mentions"."mentionable_type" = 'comment') 
    LEFT OUTER JOIN "feed_abcd"."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" 
    AND "ownerReactions"."created_by" = :authUserId;`;

    const rows: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        authUserId,
        limit,
      },
      type: QueryTypes.SELECT,
    });

    const childGrouped = this._groupComments(rows);
    await Promise.all([
      this._commonReactionService.bindReactionToComments(childGrouped),
      this._mentionService.bindMentionsToComment(childGrouped),
      this.bindUserToComment(childGrouped),
    ]);

    const childFormatted = this._classTransformer.plainToInstance(
      CommentResponseDto,
      childGrouped,
      {
        excludeExtraneousValues: true,
      }
    );

    for (const comment of comments) {
      comment.child = childFormatted.filter((i) => i.parentId === comment.id);
    }
  }

  /**
   * Delete all comments by postID
   * @param postId number
   * @param transaction Transaction
   * @returns Promise resolve boolean
   */
  public async deleteCommentsByPost(postId: number, transaction: Transaction): Promise<void> {
    const comments = await this._commentModel.findAll({
      where: { postId },
    });
    const commentIds = comments.map((i) => i.id);

    await Promise.all([
      this._mediaService.deleteMediaByEntityIds(commentIds, EntityType.COMMENT, transaction),
      this._mentionService.deleteMentionByEntityIds(
        commentIds,
        MentionableType.COMMENT,
        transaction
      ),
      this._deleteReactionService.deleteReactionByCommentIds(commentIds, transaction),
    ]).catch((ex) => this._logger.error(ex, ex.stack));

    await this._commentModel.destroy({
      where: {
        id: {
          [Op.in]: commentIds,
        },
      },
      transaction: transaction,
    });
  }

  /**
   * Get recipient when updated comment
   * @param oldMentions Array<Number>
   * @param newMentions Array<Number>
   * @protected
   */
  public async getRecipientWhenUpdatedComment(
    oldMentions: number[] = [],
    newMentions: number[] = []
  ): Promise<{
    mentionedUserIds: number[];
  }> {
    const validMentionUserIds = newMentions.filter((userId) => !oldMentions.includes(userId));

    return {
      mentionedUserIds: validMentionUserIds,
    };
  }

  /**
   * Get recipient when reply to comment.
   *** I'll be executed when the listeners handle comment created post.
   * @param userId Number
   * @param groupIds Array<Number>
   * @param parentId Number
   * @param currentMentionedUserIds Array<Number>
   * @param limit Number
   * @protected
   * @returns Promise {commentedUserIds: number[];mentionedUserIds: number[]; }
   */
  public async getRecipientWhenRepliedComment(
    userId: number,
    groupIds: number[],
    parentId: number,
    currentMentionedUserIds: number[],
    limit = 50
  ): Promise<{
    parentCommentActor: number;
    currentMentionedUserIds: number[];
    parentMentionedUserIds: number[];
    repliedUserIds: number[];
    mentionedInRepliedCommentUserIds: number[];
  }> {
    const { schema } = getDatabaseConfig();

    const parentComment = await this._commentModel.findOne({
      include: [
        {
          model: MentionModel,
          required: false,
        },
      ],
      where: {
        id: parentId,
        createdBy: {
          [Op.in]: Sequelize.literal(
            `( select user_id from ${schema}.${
              FollowModel.tableName
            } where group_id in (${groupIds.join(',')}) )`
          ),
        },
      },
    });

    if (!parentComment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_FOUND);
    }

    const recentComments = await this._commentModel.findAll({
      include: [
        {
          model: MentionModel,
          required: false,
        },
      ],
      where: {
        parentId: parentId,
        createdBy: {
          [Op.in]: Sequelize.literal(
            `( select user_id from ${schema}.${
              FollowModel.tableName
            } where group_id in (${groupIds.join(',')}) )`
          ),
        },
      },
      order: [['createdAt', 'DESC']],
      limit,
    });

    const parentMentionedUserIds = parentComment.mentions.map((m) => m.userId);

    const mentionedInRepliedCommentUserIds: number[] = [];

    const repliedUserIds = recentComments.map((c) => {
      mentionedInRepliedCommentUserIds.push(...c.mentions.map((m) => m.userId));
      return c.createdBy;
    });

    // priority
    //  1. mentioned you in a comment.
    //  2. replied to a comment you're mentioned.
    //  3. also replied to a comment you replied.
    //  4. replied to a comment you're mentioned.

    const ignoreUserId: number[] = [userId, parentComment.createdBy, ...currentMentionedUserIds];

    const filterParentMentionedUserIds = parentMentionedUserIds.filter((userId) => {
      return !ignoreUserId.includes(userId);
    });
    ignoreUserId.push(...filterParentMentionedUserIds);

    const filterRepliedUserIds = repliedUserIds.filter((userId) => {
      return !ignoreUserId.includes(userId);
    });

    ignoreUserId.push(...filterRepliedUserIds);

    const filterMentionedInRepliedCommentUserIds = mentionedInRepliedCommentUserIds.filter(
      (userId) => {
        return !ignoreUserId.includes(userId);
      }
    );

    return {
      parentCommentActor: parentComment.createdBy,
      currentMentionedUserIds: currentMentionedUserIds,
      parentMentionedUserIds: [...new Set(filterParentMentionedUserIds)],
      repliedUserIds: [...new Set(filterRepliedUserIds)],
      mentionedInRepliedCommentUserIds: [...new Set(filterMentionedInRepliedCommentUserIds)],
    };
  }

  /**
   * Get recipient when reply to comment.
   *** I'll be executed when the listeners handle comment created post.
   * @param userId Number
   * @param parentId Number
   * @param currentMentionedUserIds Array<Number>
   * @param post PostResponseDto
   * @param limit Number
   * @protected
   * @returns Promise {postOwnerId: number;mentionedPostUserId: number[]; rootCommentedUserIds: number[];rootMentionedUserIds: number[];}
   */
  public async getRecipientWhenCreatedCommentForPost(
    userId: number,
    parentId: number,
    currentMentionedUserIds: number[],
    post: IPost,
    limit = 50
  ): Promise<{
    postOwnerId: number;
    mentionedPostUserId: number[];
    rootCommentedUserIds: number[];
    rootMentionedUserIds: number[];
    currentMentionedUserIds: number[];
  }> {
    this._logger.debug(`[getRecipientWhenCreatedCommentForPost] ${JSON.stringify(post)}`);
    try {
      const { schema } = getDatabaseConfig();

      const groupIds = post.groups.map((g) => g.groupId);

      // get app comments. Ignore user request
      const rootComments = await this._commentModel.findAll({
        include: [
          {
            model: MentionModel,
            required: false,
          },
        ],
        where: {
          parentId: 0,
          postId: post.id,
          createdBy: {
            [Op.in]: Sequelize.literal(
              `( select user_id from ${schema}.${
                FollowModel.tableName
              } where group_id in (${groupIds.join(',')}) )`
            ),
          },
        },
        order: [['createdAt', 'DESC']],
        limit,
      });

      let rootMentionedUserIds: number[] = [];

      const rootCommentedUserIds: number[] = [];

      rootComments.forEach((comment) => {
        comment = comment.toJSON();
        if (!comment.mentions) {
          comment.mentions = [];
        }
        const mentionedUserInComment = comment.mentions
          .map((m) => m.userId)
          .filter((id) => id != userId && id != post.createdBy);

        rootMentionedUserIds.push(...mentionedUserInComment);
        if (comment.createdBy != userId && comment.createdBy != post.createdBy) {
          rootCommentedUserIds.push(comment.createdBy);
        }
      });

      rootMentionedUserIds = rootMentionedUserIds.filter(
        (id) => !currentMentionedUserIds.includes(id)
      );

      const mentionedUserIdsPost = post.mentions.map((m) => m.userId);

      const ignoreUserId = await this._followService.getUsersNotInGroups(
        [post.createdBy, ...mentionedUserIdsPost],
        groupIds
      );
      ignoreUserId.push(userId);

      let postOwner = post.createdBy;

      if (ignoreUserId.includes(post.createdBy)) {
        postOwner = null;
      }
      // priority
      //  1. mentioned you in a comment.
      //  2. commented to a post you're mentioned.
      //  3. also commented on a post.
      //  4. commented to a post you're mentioned.

      const filterCurrentMentionedUserIds = currentMentionedUserIds.filter(
        (userId) => !ignoreUserId.includes(userId)
      );

      ignoreUserId.push(...filterCurrentMentionedUserIds);

      const filterMentionedPostUserId = mentionedUserIdsPost.filter((userId) => {
        return !ignoreUserId.includes(userId);
      });

      ignoreUserId.push(...filterMentionedPostUserId);

      const filterRootMentionedUserIds = rootMentionedUserIds.filter((userId) => {
        return !ignoreUserId.includes(userId);
      });

      ignoreUserId.push(...filterRootMentionedUserIds);

      const filterRootCommentedUserIds = rootCommentedUserIds.filter((userId) => {
        return !ignoreUserId.includes(userId);
      });

      return {
        postOwnerId: postOwner,
        mentionedPostUserId: [...new Set(filterMentionedPostUserId)],
        rootCommentedUserIds: [...new Set(filterRootCommentedUserIds)],
        rootMentionedUserIds: [...new Set(filterRootMentionedUserIds)],
        currentMentionedUserIds: [...new Set(filterCurrentMentionedUserIds)],
      };
    } catch (e) {
      this._logger.error(e, e.stack);
      return {
        postOwnerId: null,
        mentionedPostUserId: [],
        rootCommentedUserIds: [],
        rootMentionedUserIds: [],
        currentMentionedUserIds: [],
      };
    }
  }

  /**
   * Save comment edited history
   * @param commentId number
   * @param Object { oldData: CommentResponseDto; newData: CommentResponseDto }
   * @returns Promise resolve any
   */
  public async saveCommentEditedHistory(
    commentId: number,
    { oldData, newData }: { oldData: CommentResponseDto; newData: CommentResponseDto }
  ): Promise<any> {
    return this._commentEditedHistoryModel.create({
      commentId: commentId,
      oldData: oldData,
      newData: newData,
      editedAt: newData.updatedAt ?? newData.createdAt,
    });
  }

  /**
   * Delete comment edited history
   * @param commentId number
   * @returns Promise resolve any
   */
  public async deleteCommentEditedHistory(commentId: number): Promise<any> {
    return this._commentEditedHistoryModel.destroy({
      where: {
        commentId: commentId,
      },
    });
  }

  /**
   * Get comment edited history
   * @param user UserDto
   * @param commentId number
   * @param getCommentEditedHistoryDto GetCommentEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getCommentEditedHistory(
    user: UserDto,
    commentId: number,
    getCommentEditedHistoryDto: GetCommentEditedHistoryDto
  ): Promise<PageDto<CommentEditedHistoryDto>> {
    try {
      const postId = await this.getPostIdOfComment(commentId);
      const post = await this._postService.findPost({ postId: postId });
      await this._authorityService.allowAccess(user, post);

      const { idGT, idGTE, idLT, idLTE, endTime, offset, limit, order } =
        getCommentEditedHistoryDto;
      const conditions = {};
      conditions['commentId'] = commentId;
      if (idGT) {
        conditions['id'] = {
          [Op.gt]: idGT,
        };
      }
      if (idGTE) {
        conditions['id'] = {
          [Op.gte]: idGTE,
          ...conditions['id'],
        };
      }
      if (idLT) {
        conditions['id'] = {
          [Op.lt]: idLT,
          ...conditions['id'],
        };
      }
      if (idLTE) {
        conditions['id'] = {
          [Op.lte]: idLTE,
          ...conditions,
        };
      }
      if (endTime) {
        conditions['editedAt'] = {
          [Op.lt]: endTime,
        };
      }

      const { rows, count } = await this._commentEditedHistoryModel.findAndCountAll({
        where: {
          ...conditions,
        },
        order: [['id', order]],
        offset: offset,
        limit: limit,
      });

      const result = rows.map((e) => {
        const newData: CommentResponseDto = e.toJSON().newData;
        return plainToInstance(
          CommentEditedHistoryDto,
          {
            ...newData,
            commentId: newData.id,
            editedAt: newData.updatedAt ?? newData.createdAt,
          },
          { excludeExtraneousValues: true }
        );
      });

      return new PageDto(result, {
        limit: limit,
        total: count,
      });
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }

  /**
   * Get post ID of a comment
   * @param commentId number
   * @returns Promise resolve number
   * @throws Logical exception
   */
  public async getPostIdOfComment(commentId: number): Promise<number> {
    const comment = await this._commentModel.findOne({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    return comment.postId;
  }

  private _groupComments(comments: any[]): any[] {
    const result = [];
    comments.forEach((comment) => {
      const {
        id,
        parentId,
        postId,
        content,
        totalReply,
        createdBy,
        updatedBy,
        createdAt,
        updatedAt,
      } = comment;
      const commentAdded = result.find((i) => i.id === comment.id);
      if (!commentAdded) {
        const mentions = comment.mentionUserId === null ? [] : [{ userId: comment.mentionUserId }];
        const ownerReactions =
          comment.commentReactionId === null
            ? []
            : [
                {
                  id: comment.commentReactionId,
                  reactionName: comment.reactionName,
                  createdAt: comment.reactCreatedAt,
                },
              ];
        const media =
          comment.mediaId === null
            ? []
            : [
                {
                  id: comment.mediaId,
                  url: comment.mediaUrl,
                  name: comment.mediaName,
                  type: comment.mediaType,
                  width: comment.mediaWidth,
                  height: comment.mediaHeight,
                  extension: comment.mediaExtension,
                },
              ];
        result.push({
          id,
          parentId,
          postId,
          content,
          totalReply,
          createdBy,
          updatedBy,
          createdAt,
          updatedAt,
          mentions,
          media,
          ownerReactions,
        });
        return;
      }
      if (
        comment.mentionUserId !== null &&
        !commentAdded.mentions.find((m) => m.userId === comment.mentionUserId)
      ) {
        commentAdded.mentions.push({ userId: comment.mentionUserId });
      }
      if (
        comment.commentReactionId !== null &&
        !commentAdded.ownerReactions.find((m) => m.id === comment.commentReactionId)
      ) {
        commentAdded.ownerReactions.push({
          id: comment.commentReactionId,
          reactionName: comment.reactionName,
          createdAt: comment.reactCreatedAt,
        });
      }
      if (comment.mediaId !== null && !commentAdded.media.find((m) => m.id === comment.mediaId)) {
        commentAdded.media.push({
          id: comment.mediaId,
          url: comment.mediaUrl,
          name: comment.mediaName,
          type: comment.mediaType,
          width: comment.mediaWidth,
          height: comment.mediaHeight,
          extension: comment.mediaExtension,
        });
      }
    });
    return result;
  }
}
