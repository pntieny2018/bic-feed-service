import { UserDto } from '../auth';
import sequelize from 'sequelize';
import { PostAllow } from '../post';
import { GiphyService } from '../giphy';
import { MediaService } from '../media';
import { FollowService } from '../follow';
import { SentryService } from '@app/sentry';
import { NIL, NIL as NIL_UUID } from 'uuid';
import { MentionService } from '../mention';
import { ReactionService } from '../reaction';
import { UserService } from '../../shared/user';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { PostService } from '../post/post.service';
import { createUrlFromId } from '../giphy/giphy.util';
import { EntityType } from '../media/media.constants';
import { OrderEnum, PageDto } from '../../common/dto';
import { ExceptionHelper } from '../../common/helpers';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { UserDataShareDto } from '../../shared/user/dto';
import { LogicException } from '../../common/exceptions';
import { getDatabaseConfig } from '../../config/database';
import { PostModel } from '../../database/models/post.model';
import { MediaModel } from '../../database/models/media.model';
import { PostPolicyService } from '../post/post-policy.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { GetCommentsDto, UpdateCommentDto } from './dto/requests';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PostGroupModel } from '../../database/models/post-group.model';
import { GetCommentLinkDto } from './dto/requests/get-comment-link.dto';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { CommentEditedHistoryDto, CommentResponseDto } from './dto/response';
import { CreateCommentDto, GetCommentEditedHistoryDto } from './dto/requests';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { CommentEditedHistoryModel } from '../../database/models/comment-edited-history.model';

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
    private _reactionService: ReactionService,
    private _authorityService: AuthorityService,
    private _postPolicyService: PostPolicyService,
    private _giphyService: GiphyService,
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _followService: FollowService,
    @InjectModel(CommentEditedHistoryModel)
    private readonly _commentEditedHistoryModel: typeof CommentEditedHistoryModel,
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Create new comment
   * @param user UserDto
   * @param createCommentDto CreateCommentDto
   * @param replyId String
   * @return Promise resolve CommentResponseDto
   */
  public async create(
    user: UserDto,
    createCommentDto: CreateCommentDto,
    replyId = NIL_UUID
  ): Promise<IComment> {
    this._logger.debug(
      `[create] user: ${JSON.stringify(user)}, createCommentDto: ${JSON.stringify(
        createCommentDto
      )},replyId: ${replyId} `
    );

    let post;

    if (replyId !== NIL_UUID) {
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
          parentId: NIL_UUID,
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
    await this._authorityService.checkCanReadPost(user, post);

    // check post policy
    await this._postPolicyService.allow(post, PostAllow.COMMENT);

    await this._giphyService.saveGiphyData(createCommentDto.giphy);

    //HOTFIX: hot fix create comment with image
    const comment = await this._commentModel.create({
      createdBy: user.id,
      updatedBy: user.id,
      parentId: replyId,
      content: createCommentDto.content,
      postId: post.id,
      giphyId: createCommentDto.giphy ? createCommentDto.giphy.id : null,
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

      return comment;
    } catch (ex) {
      await transaction.rollback();
      await comment.destroy();
      throw ex;
    }
  }

  /**
   * Update comment
   * @param user UserDto
   * @param commentId String
   * @param updateCommentDto UpdateCommentDto
   * @return Promise resolve CommentResponseDto
   */
  public async update(
    user: UserDto,
    commentId: string,
    updateCommentDto: UpdateCommentDto
  ): Promise<{
    comment: IComment;
    oldComment: IComment;
  }> {
    this._logger.debug(
      `[update] user: ${JSON.stringify(user)}, updateCommentDto: ${JSON.stringify(
        updateCommentDto
      )},commentId: ${commentId} `
    );

    const comment = await this._commentModel.findOne({
      include: [
        {
          model: MentionModel,
          as: 'mentions',
        },
      ],
      where: {
        id: commentId,
        createdBy: user.id,
      },
    });

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const post = await this._postService.findPost({
      postId: comment.postId,
    });

    await this._giphyService.saveGiphyData(updateCommentDto.giphy);

    // check user can access
    await this._authorityService.checkCanReadPost(user, post);

    // check post policy
    await this._postPolicyService.allow(post, PostAllow.COMMENT);

    const oldComment = comment.toJSON();

    const transaction = await this._sequelizeConnection.transaction();

    try {
      await comment.update(
        {
          updatedBy: user.id,
          content: updateCommentDto.content,
          giphyId: updateCommentDto.giphy ? updateCommentDto.giphy.id : null,
          edited: true,
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

      return {
        comment: comment,
        oldComment: oldComment,
      };
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      await transaction.rollback();
      throw ex;
    }
  }

  /**
   * Get single comment
   * @param user UserDto
   * @param commentId String
   * @param childLimit Number
   * @returns Promise resolve CommentResponseDto
   */
  public async getComment(
    user: UserDto,
    commentId: string,
    childLimit = 25
  ): Promise<CommentResponseDto> {
    this._logger.debug(`[getComment] commentId: ${commentId} `);

    const response = await this._commentModel.findOne({
      where: {
        id: commentId,
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
    });

    if (!response) {
      throw new LogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }
    const rawComment = response.toJSON();
    await Promise.all([
      this._reactionService.bindReactionToComments([rawComment]),
      this._mentionService.bindMentionsToComment([rawComment]),
      this._giphyService.bindUrlToComment([rawComment]),
      this.bindUserToComment([rawComment]),
    ]);

    const result = this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
    await this.bindChildrenToComment([result], user.id, childLimit);
    return result;
  }

  /**
   * Get comment list
   * @param user UserDto
   * @param getCommentsDto GetCommentsDto
   * @param checkAccess Boolean
   * @returns Promise resolve PageDto<CommentResponseDto>
   */
  public async getComments(
    getCommentsDto: GetCommentsDto,
    user?: UserDto,
    checkAccess = true
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug(
      `[getComments] user: ${JSON.stringify(user)}, getCommentDto: ${JSON.stringify(
        getCommentsDto
      )}`
    );
    const { childLimit, postId, parentId } = getCommentsDto;
    const post = await this._postService.findPost({
      postId,
    });

    if (checkAccess && user) {
      await this._authorityService.checkCanReadPost(user, post);
    }
    if (checkAccess && !user) {
      await this._authorityService.checkIsPublicPost(post);
    }
    const userId = user ? user.id : null;
    const comments = await this._getComments(getCommentsDto, userId);

    if (comments.list.length && parentId === NIL_UUID) {
      await this.bindChildrenToComment(comments.list, userId, childLimit);
    }
    await Promise.all([
      this._reactionService.bindReactionToComments(comments.list),
      this._mentionService.bindMentionsToComment(comments.list),
      this._giphyService.bindUrlToComment(comments.list),
      this.bindUserToComment(comments.list),
    ]);
    return comments;
  }

  /**
   * Get comment list
   * @param commentId String
   * @param user UserDto
   * @param getCommentLinkDto GetCommentLinkDto
   * @returns Promise resolve PageDto<CommentResponseDto>
   */
  public async getCommentLink(
    commentId: string,
    user: UserDto,
    getCommentLinkDto: GetCommentLinkDto
  ): Promise<any> {
    this._logger.debug(
      `[getCommentLink] user: ${JSON.stringify(user)}, getCommentDto: ${JSON.stringify(
        getCommentLinkDto
      )}`
    );
    const { limit, targetChildLimit, childLimit } = getCommentLinkDto;

    const checkComment = await this._commentModel.findByPk(commentId);
    if (!checkComment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_FOUND);
    }
    const { postId } = checkComment;
    const post = await this._postService.findPost({
      postId,
    });
    if (user) {
      await this._authorityService.checkCanReadPost(user, post);
    } else {
      await this._authorityService.checkIsPublicPost(post);
    }
    const userId = user ? user.id : null;
    const actor = await this._userService.get(post.createdBy);
    const parentId = checkComment.parentId !== NIL_UUID ? checkComment.parentId : commentId;
    const comments = await this._getComments(
      {
        limit,
        postId,
      },
      userId,
      parentId
    );
    if (comments.list.length && limit > 1) {
      await this.bindChildrenToComment(comments.list, userId, childLimit);
    }
    const aroundChildId = checkComment.parentId !== NIL_UUID ? commentId : NIL_UUID;
    const child = await this._getComments(
      {
        limit: targetChildLimit,
        parentId,
        postId,
      },
      userId,
      aroundChildId
    );
    comments.list.map((cm) => {
      if (cm.id === parentId) {
        cm.child = child;
      }
      return cm;
    });
    await Promise.all([
      this._reactionService.bindReactionToComments(comments.list),
      this._mentionService.bindMentionsToComment(comments.list),
      this._giphyService.bindUrlToComment(comments.list),
      this.bindUserToComment(comments.list),
    ]);
    comments['actor'] = actor;
    return comments;
  }

  private async _getCondition(getCommentsDto: GetCommentsDto): Promise<any> {
    const { schema } = getDatabaseConfig();
    const { postId, parentId, idGT, idGTE, idLT, idLTE } = getCommentsDto;
    let condition = ` "c".parent_id = ${this._sequelizeConnection.escape(parentId ?? NIL)}`;
    if (postId) {
      condition += ` AND "c".post_id = ${this._sequelizeConnection.escape(postId)}`;
    }

    if (idGT) {
      const id = this._sequelizeConnection.escape(idGT);
      condition += ` AND ( "c".id != ${id} AND "c".created_at >= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }
    if (idGTE) {
      const id = this._sequelizeConnection.escape(idGTE);
      condition += ` AND ( "c".created_at >= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }
    if (idLT) {
      const id = this._sequelizeConnection.escape(idLT);
      condition += ` AND ( "c".id != ${id} AND "c".created_at <= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }
    if (idLTE) {
      const id = this._sequelizeConnection.escape(idLTE);
      condition += ` AND ( "c".created_at <= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }
    return condition;
  }

  private async _getComments(
    getCommentsDto: GetCommentsDto,
    authUserId?: number,
    aroundId = NIL_UUID
  ): Promise<PageDto<CommentResponseDto>> {
    const { limit } = getCommentsDto;
    const order = getCommentsDto.order ?? OrderEnum.DESC;
    const { schema } = getDatabaseConfig();
    let query: string;
    const condition = await this._getCondition(getCommentsDto);

    let select = `SELECT "CommentModel".*,
    "media"."id" AS "mediaId",
    "media"."url" AS "mediaUrl", 
    "media"."type" AS "mediaType",
    "media"."name" AS "mediaName",
    "media"."width" AS "mediaWidth", 
    "media"."height" AS "mediaHeight", 
    "media"."extension" AS "mediaExtension",
    "mentions"."user_id" AS "mentionUserId"`;

    if (authUserId) {
      select += `,"ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"`;
    }

    const subSelect = `SELECT 
    "c"."id",
    "c"."parent_id" AS "parentId", 
    "c"."post_id" AS "postId",
    "c"."content", 
    "c"."edited", 
    "c"."giphy_id" as "giphyId",
    "c"."total_reply" AS "totalReply", 
    "c"."created_by" AS "createdBy", 
    "c"."updated_by" AS "updatedBy", 
    "c"."created_at" AS "createdAt", 
    "c"."updated_at" AS "updatedAt"`;
    if (aroundId === NIL_UUID) {
      query = `${select}
      FROM (
        ${subSelect}
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
      ${
        authUserId
          ? `LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" AND "ownerReactions"."created_by" = :authUserId`
          : ``
      }
      ORDER BY "CommentModel"."createdAt" ${order}`;
    } else {
      query = `${select}
      FROM (
        (
        ${subSelect}
        FROM ${schema}."comments" AS "c"
        WHERE ${condition} AND "c".created_at <= ( SELECT "c1"."created_at" FROM ${schema}."comments" AS "c1" WHERE "c1".id = :aroundId)
        ORDER BY "c"."created_at" DESC
        OFFSET 0 LIMIT :limitTop
        )
        UNION ALL 
        (
          ${subSelect}
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
      ${
        authUserId
          ? `LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" AND "ownerReactions"."created_by" = :authUserId `
          : ``
      }
      ORDER BY "CommentModel"."createdAt" ${order}`;
    }
    const rows: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        aroundId,
        authUserId,
        limitTop: limit + 1,
        limitBottom: limit,
      },
      type: QueryTypes.SELECT,
    });
    const childGrouped = this._groupComments(rows);
    let hasNextPage: boolean;
    let hasPreviousPage = false;
    let commentsFiltered: any[];
    if (aroundId !== NIL_UUID) {
      const index = childGrouped.findIndex((i) => i.id === aroundId);
      const n = Math.min(limit, childGrouped.length);
      let start = limit >= childGrouped.length ? 0 : Math.max(0, index + 1 - Math.round(n / 2));
      let end = start + n;
      if (end >= childGrouped.length) {
        end = childGrouped.length;
        start = end - n;
      }
      commentsFiltered = childGrouped.slice(start, end);
      hasPreviousPage = start >= 1;
      hasNextPage = !!childGrouped[end];
    } else {
      hasNextPage = childGrouped.length === limit + 1;
      if (hasNextPage) childGrouped.pop();
      commentsFiltered = childGrouped;
    }

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
   * @param commentId string
   * @returns Promise resolve boolean
   */
  public async destroy(user: UserDto, commentId: string): Promise<IComment> {
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

    await this._authorityService.checkCanReadPost(user, post);

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

        this._reactionService.deleteReactionByCommentIds([commentId], transaction),
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

      return comment;
    } catch (e) {
      this._logger.error(e, e.stack);
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Bind user info to comment list
   * @param commentsResponse  Array<IComment>
   * @returns Promise resolve void
   */
  public async bindUserToComment(commentsResponse: any[]): Promise<void> {
    const actorIds: number[] = [];

    for (const comment of commentsResponse) {
      actorIds.push(comment.createdBy);

      if (comment.parent) {
        actorIds.push(comment.parent.createdBy);
      }

      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          actorIds.push(cm.createdBy);
        }
      }
    }

    const usersInfo = await this._userService.getMany(actorIds);
    const actorsInfo = plainToInstance(UserDataShareDto, usersInfo, {
      excludeExtraneousValues: true,
    });
    for (const comment of commentsResponse) {
      if (comment.parent) {
        comment.parent.actor = actorsInfo.find((u) => u.id === comment.parent.createdBy);
      }
      comment.actor = actorsInfo.find((u) => u.id === comment.createdBy);
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          cm.actor = actorsInfo.find((u) => u.id === cm.createdBy);
        }
      }
    }
  }

  /**
   * Bind user info to comment list
   * @returns Promise resolve void
   * @param comments
   * @param authUserId
   * @param limit
   */
  public async bindChildrenToComment(
    comments: any[],
    authUserId?: number,
    limit = 10
  ): Promise<void> {
    const subQuery = [];
    const { schema } = getDatabaseConfig();
    for (const comment of comments) {
      subQuery.push(`(SELECT * 
      FROM (
        SELECT 
              "id", 
              "parent_id" AS "parentId", 
              "post_id" AS "postId", 
              "content", 
              "edited",
              "total_reply" AS "totalReply", 
              "created_by" AS "createdBy", 
              "updated_by" AS "updatedBy", 
              "created_at" AS "createdAt", 
              "updated_at" AS "updatedAt",
              "giphy_id" AS "giphyId"
        FROM ${schema}."comments" AS "CommentModel" 
        WHERE "CommentModel"."parent_id" = ${this._sequelizeConnection.escape(comment.id)} 
        ORDER BY "CommentModel"."created_at" DESC LIMIT :limit
      ) AS sub)`);
    }

    let query = `SELECT 
      "CommentModel".*,
      "media"."id" AS "mediaId",
      "media"."url" AS "mediaUrl", 
      "media"."type" AS "mediaType",
      "media"."name" AS "mediaName",
      "media"."width" AS "mediaWidth", 
      "media"."height" AS "mediaHeight", 
      "media"."extension" AS "mediaExtension",
      "mentions"."user_id" AS "mentionUserId"
      ${
        authUserId
          ? `,"ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"`
          : ``
      }
    FROM (${subQuery.join(' UNION ALL ')}) AS "CommentModel" 
    LEFT OUTER JOIN ( 
      ${schema}."comments_media" AS "media->CommentMediaModel" 
      INNER JOIN ${schema}."media" AS "media" ON "media"."id" = "media->CommentMediaModel"."media_id"
    ) ON "CommentModel"."id" = "media->CommentMediaModel"."comment_id" 
    LEFT OUTER JOIN ${schema}."mentions" AS "mentions" ON "CommentModel"."id" = "mentions"."entity_id" 
        AND ("mentions"."mentionable_type" = 'comment' AND "mentions"."mentionable_type" = 'comment')`;
    if (authUserId) {
      query += `LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" 
      AND "ownerReactions"."created_by" = :authUserId;`;
    }

    const rows: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        authUserId,
        limit: limit + 1,
      },
      type: QueryTypes.SELECT,
    });

    const childGrouped = this._groupComments(rows);
    const childFormatted = this._classTransformer.plainToInstance(
      CommentResponseDto,
      childGrouped,
      {
        excludeExtraneousValues: true,
      }
    );
    for (const comment of comments) {
      const childList = childFormatted.filter((i) => i.parentId === comment.id);
      const hasNextPage = childList.length > limit;
      if (hasNextPage) childList.pop();
      comment.child = new PageDto<CommentResponseDto>(childList, {
        limit,
        offset: 0,
        hasNextPage,
        hasPreviousPage: false,
      });
    }
  }

  /**
   * Delete all comments by postID
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   */
  public async deleteCommentsByPost(postId: string, transaction: Transaction): Promise<void> {
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
      this._reactionService.deleteReactionByCommentIds(commentIds, transaction),
    ]).catch((ex) => {
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
    });

    await this._commentModel.destroy({
      where: {
        id: {
          [Op.in]: commentIds,
        },
      },
      transaction: transaction,
    });
  }

  public async findComment(commentId: string): Promise<CommentResponseDto> {
    const get = async (cid: string): Promise<CommentModel> => {
      return await this._commentModel.findOne({
        where: {
          id: cid,
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
          },
        ],
      });
    };
    const response = await get(commentId);

    if (!response) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }
    const rawComment = response.toJSON();

    if (rawComment.parentId) {
      const parentComment = await get(rawComment.parentId);
      if (parentComment) {
        rawComment.parent = parentComment.toJSON();
      }
    }
    await this._mentionService.bindMentionsToComment([rawComment]);

    await this._giphyService.bindUrlToComment([rawComment]);

    await this.bindUserToComment([rawComment]);

    await this._reactionService.bindReactionToComments([rawComment]);

    return this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Save comment edited history
   * @param commentId string
   * @param Object { oldData: CommentResponseDto; newData: CommentResponseDto }
   * @returns Promise resolve any
   */
  public async saveCommentEditedHistory(
    commentId: string,
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
   * @param commentId string
   * @param getCommentEditedHistoryDto GetCommentEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getCommentEditedHistory(
    user: UserDto,
    commentId: string,
    getCommentEditedHistoryDto: GetCommentEditedHistoryDto
  ): Promise<PageDto<CommentEditedHistoryDto>> {
    const { schema } = getDatabaseConfig();

    try {
      const postId = await this.getPostIdOfComment(commentId);
      const post = await this._postService.findPost({ postId: postId });
      await this._authorityService.checkCanReadPost(user, post);

      const { idGT, idGTE, idLT, idLTE, endTime, offset, limit, order } =
        getCommentEditedHistoryDto;
      const conditions = {};
      conditions['commentId'] = commentId;

      if (idGT) {
        conditions['id'] = {
          [Op.not]: idGT,
          ...conditions['id'],
        };
        conditions['editedAt'] = {
          [Op.gte]: sequelize.literal(
            `(SELECT "ceh".edited_at FROM ${schema}.comment_edited_history AS "ceh" WHERE "ceh".id = ${this._sequelizeConnection.escape(
              idGT
            )})`
          ),
          ...conditions['editedAt'],
        };
      }

      if (idGTE) {
        conditions['editedAt'] = {
          [Op.gte]: sequelize.literal(
            `SELECT "ceh".edited_at FROM ${schema}.comment_edited_history AS "ceh" WHERE "ceh".id = ${this._sequelizeConnection.escape(
              idGTE
            )}`
          ),
          ...conditions['editedAt'],
        };
      }

      if (idLT) {
        conditions['id'] = {
          [Op.not]: idLT,
          ...conditions['id'],
        };
        conditions['editedAt'] = {
          [Op.lte]: sequelize.literal(
            `SELECT "ceh".edited_at FROM ${schema}.comment_edited_history as "ceh" WHERE "ceh".id = ${this._sequelizeConnection.escape(
              idLT
            )}`
          ),
          ...conditions['editedAt'],
        };
      }

      if (idLTE) {
        conditions['editedAt'] = {
          [Op.lte]: sequelize.literal(
            `SELECT "ceh".edited_at FROM ${schema}.comment_edited_history as "ceh" WHERE "ceh".id = ${this._sequelizeConnection.escape(
              idLTE
            )}`
          ),
          ...conditions['editedAt'],
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
   * @param commentId string
   * @returns Promise resolve string
   * @throws Logical exception
   */
  public async getPostIdOfComment(commentId: string): Promise<string> {
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
        edited,
        postId,
        giphyId,
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
        const ownerReactions = !comment.commentReactionId
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
          giphyId,
          giphyUrl: createUrlFromId(giphyId),
          edited,
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
