import { UserDto } from '../auth';
import { Op, Transaction } from 'sequelize';
import { PostAllow } from '../post';
import { GiphyService } from '../giphy';
import { MediaService } from '../media';
import { SentryService } from '@app/sentry';
import { NIL as NIL_UUID } from 'uuid';
import { MentionService } from '../mention';
import { ReactionService } from '../reaction';
import { UserService } from '../../shared/user';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { PostService } from '../post/post.service';
import { createUrlFromId } from '../giphy/giphy.util';
import { EntityType } from '../media/media.constants';
import { PageDto } from '../../common/dto';
import { ExceptionHelper } from '../../common/helpers';
import { UserDataShareDto } from '../../shared/user/dto';
import { LogicException } from '../../common/exceptions';
import { MediaModel } from '../../database/models/media.model';
import { PostPolicyService } from '../post/post-policy.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { CreateCommentDto, GetCommentsDto, UpdateCommentDto } from './dto/requests';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { GetCommentLinkDto } from './dto/requests/get-comment-link.dto';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { CommentResponseDto } from './dto/response';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';

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
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Create/reply new comment
   */
  public async create(
    user: UserDto,
    createCommentDto: CreateCommentDto,
    replyId = NIL_UUID
  ): Promise<IComment> {
    const post = await this._postService.findPost({
      postId: createCommentDto.postId,
    });

    if (replyId !== NIL_UUID) {
      const parentComment = await this._commentModel.findOne({
        include: [
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
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_REPLY_NOT_EXISTING);
      }
    }

    // check user can access
    await this._authorityService.checkCanReadPost(user, post);

    // check post policy
    await this._postPolicyService.allow(post, PostAllow.COMMENT);

    await this._giphyService.saveGiphyData(createCommentDto.giphy);

    const transaction = await this._sequelizeConnection.transaction();
    try {
      //HOTFIX: hot fix create comment with image
      const comment = await this._commentModel.create(
        {
          createdBy: user.id,
          updatedBy: user.id,
          parentId: replyId,
          content: createCommentDto.content,
          postId: post.id,
          giphyId: createCommentDto.giphy ? createCommentDto.giphy.id : null,
        },
        { transaction }
      );

      const userMentionIds = createCommentDto.mentions;

      if (userMentionIds.length) {
        const groupAudienceIds = post.groups.map((g) => g.groupId);

        await this._mentionService.checkValid(groupAudienceIds, userMentionIds);

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

        await this._mediaService.isValid(mediaIds, user.id);
        await this._mediaService.sync(comment.id, EntityType.COMMENT, mediaIds, transaction);
      }

      await transaction.commit();

      return comment;
    } catch (ex) {
      await transaction.rollback();
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
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
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
        await this._mentionService.checkValid(groupAudienceIds, userMentionIds);
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
        await this._mediaService.isValid(mediaIds, user.id);
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
   */
  public async getComment(
    user: UserDto,
    commentId: string,
    childLimit = 25
  ): Promise<CommentResponseDto> {
    const response = await this._commentModel.findOne({
      where: {
        id: commentId,
      },
      include: [
        {
          model: MediaModel,
          as: 'media',
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
      throw new LogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }
    const rawComment = response.toJSON();
    await Promise.all([
      this._reactionService.bindToComments([rawComment]),
      this._mentionService.bindToComment([rawComment]),
      this._giphyService.bindUrlToComment([rawComment]),
      this.bindUserToComment([rawComment]),
    ]);

    const result = this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
    if (childLimit > 0) {
      await this.bindChildrenToComment([result], user.id, childLimit);
    }
    return result;
  }

  /**
   * Get multiple comment by ids
   */
  public async getCommentsByIds(commentIds: string[]): Promise<CommentResponseDto[]> {
    const responses = await this._commentModel.findAll({
      order: [['createdAt', 'DESC']],
      where: {
        id: {
          [Op.in]: commentIds,
        },
      },
      include: [
        {
          model: MediaModel,
          as: 'media',
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
    });

    if (!responses) {
      throw new LogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }
    const rawComment = responses.map((r) => r.toJSON());
    await Promise.all([
      this._mentionService.bindToComment(rawComment),
      this._giphyService.bindUrlToComment(rawComment),
      this.bindUserToComment(rawComment),
    ]);

    return this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
  }
  /**
   * Get comment list
   */
  public async getComments(
    getCommentsDto: GetCommentsDto,
    user?: UserDto,
    checkAccess = true
  ): Promise<PageDto<CommentResponseDto>> {
    const { childLimit, postId, parentId, limit } = getCommentsDto;
    const post = await this._postService.findPost({
      postId,
    });

    if (checkAccess && user) {
      await this._authorityService.checkCanReadPost(user, post);
    }
    if (checkAccess && !user) {
      await this._authorityService.checkIsPublicPost(post);
    }
    if (!post.canComment) {
      return new PageDto<CommentResponseDto>([], {
        limit,
        offset: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    }
    const userId = user ? user.id : null;
    const comments = await this._getComments(getCommentsDto, userId);

    if (comments.list.length && parentId === NIL_UUID && childLimit) {
      await this.bindChildrenToComment(comments.list, userId, childLimit);
    }
    await Promise.all([
      this._reactionService.bindToComments(comments.list),
      this._mentionService.bindToComment(comments.list),
      this._giphyService.bindUrlToComment(comments.list),
      this.bindUserToComment(comments.list),
    ]);
    return comments;
  }

  /**
   * Get comment list
   */
  public async getCommentLink(
    commentId: string,
    user: UserDto,
    getCommentLinkDto: GetCommentLinkDto
  ): Promise<any> {
    const { limit, targetChildLimit, childLimit } = getCommentLinkDto;
    //check post exist
    if (getCommentLinkDto.postId) {
      await this._postService.findPost({
        postId: getCommentLinkDto.postId,
      });
    }
    const checkComment = await this._commentModel.findByPk(commentId);
    if (!checkComment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
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
    if (!post.canComment) {
      return new PageDto<CommentResponseDto>([], {
        limit,
        offset: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
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
    //get child comment
    if (comments.list.length && limit > 1 && childLimit) {
      await this.bindChildrenToComment(comments.list, userId, childLimit);
    }

    //get child for target comment
    if (targetChildLimit > 0) {
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
      comments.list.forEach((cm) => {
        if (cm.id === parentId) {
          cm.child = child;
        }
      });
    }

    await Promise.all([
      this._reactionService.bindToComments(comments.list),
      this._mentionService.bindToComment(comments.list),
      this._giphyService.bindUrlToComment(comments.list),
      this.bindUserToComment(comments.list),
    ]);
    comments['actor'] = actor;
    return comments;
  }

  private async _getComments(
    getCommentsDto: GetCommentsDto,
    authUserId?: string,
    aroundId = NIL_UUID
  ): Promise<PageDto<CommentResponseDto>> {
    const { limit } = getCommentsDto;
    const rows: any[] = await CommentModel.getListData(getCommentsDto, authUserId, aroundId);
    const childGrouped = this._groupComments(rows);
    let hasNextPage: boolean;
    let hasPreviousPage = false;
    let commentsFiltered: any[];
    if (aroundId !== NIL_UUID) {
      const indexOfAroundCommentId = childGrouped.findIndex((i) => i.id === aroundId);
      const numerOfComments = Math.min(limit, childGrouped.length);
      let startIndex =
        limit >= childGrouped.length
          ? 0
          : Math.max(0, indexOfAroundCommentId + 1 - Math.round(numerOfComments / 2));
      let endIndex = startIndex + numerOfComments;
      if (endIndex >= childGrouped.length) {
        endIndex = childGrouped.length;
        startIndex = endIndex - numerOfComments;
      }
      commentsFiltered = childGrouped.slice(startIndex, endIndex);
      hasPreviousPage = startIndex >= 1;
      hasNextPage = !!childGrouped[endIndex];
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
   */
  public async destroy(user: UserDto, commentId: string): Promise<IComment> {
    const comment = await this._commentModel.findOne({
      where: {
        id: commentId,
        createdBy: user.id,
      },
    });
    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }

    const post = await this._postService.findPost({
      commentId: commentId,
    });

    await this._authorityService.checkCanReadPost(user, post);

    const transaction = await this._sequelizeConnection.transaction();
    const childComments = await this._commentModel.findAll({
      where: {
        parentId: comment.id,
      },
      transaction: transaction,
    });
    const commentIdsNeedDelete = childComments.map((child) => child.id);
    commentIdsNeedDelete.push(comment.id);
    try {
      await Promise.all([
        this._mediaService.deleteMediaByEntityIds(
          commentIdsNeedDelete,
          EntityType.COMMENT,
          transaction
        ),
        this._mentionService.deleteByEntityIds(
          commentIdsNeedDelete,
          MentionableType.COMMENT,
          transaction
        ),
        this._reactionService.deleteByCommentIds(commentIdsNeedDelete, transaction),
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
   */
  public async bindUserToComment(commentsResponse: any[]): Promise<void> {
    const actorIds = this._getActorIdsByComments(commentsResponse);

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

  private _getActorIdsByComments(commentsResponse: any[]): string[] {
    const actorIds: string[] = [];

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

    return actorIds;
  }

  /**
   * Bind user info to comment list
   */
  public async bindChildrenToComment(
    comments: any[],
    authUserId?: string,
    limit = 10
  ): Promise<void> {
    const rows = await CommentModel.getChildByComments(comments, authUserId, limit);
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
   */
  public async deleteCommentsByPost(postId: string, transaction: Transaction): Promise<void> {
    const comments = await this._commentModel.findAll({
      where: { postId },
    });
    const commentIds = comments.map((i) => i.id);

    await Promise.all([
      this._mediaService.deleteMediaByEntityIds(commentIds, EntityType.COMMENT, transaction),
      this._mentionService.deleteByEntityIds(commentIds, MentionableType.COMMENT, transaction),
      this._reactionService.deleteByCommentIds(commentIds, transaction),
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
      return this._commentModel.findOne({
        where: {
          id: cid,
        },
        include: [
          {
            model: MediaModel,
            as: 'media',
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
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }
    const rawComment = response.toJSON();

    if (rawComment.parentId) {
      const parentComment = await get(rawComment.parentId);
      if (parentComment) {
        rawComment.parent = parentComment.toJSON();
      }
    }
    await this._mentionService.bindToComment([rawComment]);

    await this._giphyService.bindUrlToComment([rawComment]);

    await this.bindUserToComment([rawComment]);

    await this._reactionService.bindToComments([rawComment]);

    return this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get post ID of a comment
   */
  public async getPostIdOfComment(commentId: string): Promise<string> {
    const comment = await this._commentModel.findOne({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
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
