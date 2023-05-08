import { SentryService } from '@app/sentry';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NIL as NIL_UUID } from 'uuid';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { PageDto } from '../../common/dto';
import { LogicException } from '../../common/exceptions';
import { ExceptionHelper } from '../../common/helpers';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { MentionModel } from '../../database/models/mention.model';
import { AuthorityService } from '../authority';
import { GiphyService } from '../giphy';
import { createUrlFromId } from '../giphy/giphy.util';
import { MediaService } from '../media';
import { EntityType } from '../media/media.constants';
import { MentionService } from '../mention';
import { PostAllow } from '../post';
import { PostPolicyService } from '../post/post-policy.service';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import { TargetType } from '../report-content/contstants';
import { CreateCommentDto, GetCommentsDto, UpdateCommentDto } from './dto/requests';
import { GetCommentLinkDto } from './dto/requests/get-comment-link.dto';
import { CommentResponseDto } from './dto/response';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';

@Injectable()
export class CommentService {
  private _logger = new Logger(CommentService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(forwardRef(() => PostService))
    private _postService: PostService,
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService,
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
    const { media } = createCommentDto;
    const post = await this._postService.findPost({
      postId: createCommentDto.postId,
    });
    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_POST_NOT_EXISTING);
    }

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
          mediaJson: media || {
            files: [],
            images: [],
            videos: [],
          },
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
    const { media } = updateCommentDto;
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
          mediaJson: media || {
            files: [],
            images: [],
            videos: [],
          },
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

      await transaction.commit();

      return {
        comment: comment,
        oldComment: oldComment,
      };
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
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
      attributes: {
        include: [['media_json', 'media']],
      },
      where: {
        id: commentId,
      },
      include: [
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
      attributes: {
        include: [['media_json', 'media']],
      },
      order: [['createdAt', 'DESC']],
      where: {
        id: {
          [Op.in]: commentIds,
        },
      },
      include: [
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
    let entityIdsReportedByUser = [];
    if (user) {
      entityIdsReportedByUser = await this._postService.getEntityIdsReportedByUser(user.id, [
        TargetType.POST,
        TargetType.ARTICLE,
      ]);
    }
    if (entityIdsReportedByUser.includes(postId)) {
      return new PageDto<CommentResponseDto>([], {
        limit,
        offset: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    }

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
   * If comment id is child: load arround parent and arround child comments
   * If comment id is parent: load arround parent and child comments in parent
   */
  public async getCommentsArroundId(
    commentId: string,
    user: UserDto,
    getCommentsArroundIdDto: GetCommentLinkDto
  ): Promise<any> {
    const { limit, targetChildLimit, childLimit } = getCommentsArroundIdDto;
    //check post exist
    if (getCommentsArroundIdDto.postId) {
      await this._postService.findPost({
        postId: getCommentsArroundIdDto.postId,
      });
    }
    const checkComment = await this._commentModel.findByPk(commentId);
    if (!checkComment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }

    let entityIdsReportedByUser = [];
    if (user) {
      entityIdsReportedByUser = await this._postService.getEntityIdsReportedByUser(user.id, [
        TargetType.COMMENT,
        TargetType.POST,
        TargetType.ARTICLE,
      ]);
    }

    if (entityIdsReportedByUser.includes(commentId)) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }

    const { postId } = checkComment;

    if (entityIdsReportedByUser.includes(postId)) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

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
    const actor = await this._userAppService.findOne(post.createdBy);

    const isParentComment = checkComment.parentId === NIL_UUID;

    const arroundParentCommentId = isParentComment ? commentId : checkComment.parentId;
    const commentsLevelRoot = await this._getCommentsArroundCommentId(
      arroundParentCommentId,
      {
        limit,
        postId,
      },
      userId
    );

    //get child comment except arroundParentCommentId
    if (commentsLevelRoot.list.length && limit > 1 && childLimit) {
      await this.bindChildrenToComment(commentsLevelRoot.list, userId, childLimit);
    }

    //get child for target comment
    if (targetChildLimit > 0) {
      let childOfArroundId;
      //Load child comments by parent sort created desc
      if (isParentComment) {
        childOfArroundId = await this._getComments(
          {
            limit: targetChildLimit,
            parentId: arroundParentCommentId,
            postId,
          },
          userId
        );
      } else {
        //Load arround child
        childOfArroundId = await this._getCommentsArroundCommentId(
          commentId,
          {
            limit: targetChildLimit,
            parentId: arroundParentCommentId,
            postId,
          },
          userId
        );
      }

      commentsLevelRoot.list.forEach((cm) => {
        if (cm.id === arroundParentCommentId) {
          cm.child = childOfArroundId;
        }
      });
    }

    await Promise.all([
      this._reactionService.bindToComments(commentsLevelRoot.list),
      this._mentionService.bindToComment(commentsLevelRoot.list),
      this._giphyService.bindUrlToComment(commentsLevelRoot.list),
      this.bindUserToComment(commentsLevelRoot.list),
    ]);
    commentsLevelRoot['actor'] = actor;
    return commentsLevelRoot;
  }

  private async _getComments(
    getCommentsDto: GetCommentsDto,
    authUserId?: string
  ): Promise<PageDto<CommentResponseDto>> {
    const { limit } = getCommentsDto;
    const rows: any[] = await CommentModel.getList(getCommentsDto, authUserId);
    const childGrouped = this._groupComments(rows);
    const hasNextPage = childGrouped.length === limit + 1;
    if (hasNextPage) childGrouped.pop();
    const commentsFiltered = childGrouped;

    const result = this._classTransformer.plainToInstance(CommentResponseDto, commentsFiltered, {
      excludeExtraneousValues: true,
    });
    return new PageDto<CommentResponseDto>(result, {
      limit,
      offset: 0,
      hasNextPage,
      hasPreviousPage: false,
    });
  }

  private async _getCommentsArroundCommentId(
    aroundId: string,
    getCommentsDto: GetCommentsDto,
    authUserId?: string
  ): Promise<PageDto<CommentResponseDto>> {
    const { limit } = getCommentsDto;
    const rows: any[] = await CommentModel.getListArroundId(aroundId, getCommentsDto, authUserId);

    const childGrouped = this._groupComments(rows);
    let hasPreviousPage = false;

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
    const commentsFiltered = childGrouped.slice(startIndex, endIndex);
    hasPreviousPage = startIndex >= 1;
    const hasNextPage = !!childGrouped[endIndex];

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
      this._logger.error(JSON.stringify(e?.stack));
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Bind user info to comment list
   */
  public async bindUserToComment(commentsResponse: any[]): Promise<void> {
    const actorIds = this._getActorIdsByComments(commentsResponse);

    const actorsInfo = await this._userAppService.findAllByIds(actorIds);
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
      this._mentionService.deleteByEntityIds(commentIds, MentionableType.COMMENT, transaction),
      this._reactionService.deleteByCommentIds(commentIds, transaction),
    ]).catch((ex) => {
      this._logger.error(JSON.stringify(ex?.stack));
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
        attributes: {
          include: [['media_json', 'media']],
        },
        where: {
          id: cid,
        },
        include: [
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
        media,
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
    });
    return result;
  }

  public async isExisted(id: string, returning = false): Promise<[boolean, IComment]> {
    const conditions = {
      id: id,
    };
    if (returning) {
      const comment = await this._commentModel.findOne({
        where: conditions,
      });
      if (comment) {
        return [true, comment];
      }
      return [false, null];
    }

    const commentCount = await this._commentModel.count({
      where: conditions,
    });
    return [commentCount > 1, null];
  }

  public async updateData(commentIds: string[], data: Partial<IComment>): Promise<void> {
    await this._commentModel.update(data, {
      where: {
        id: {
          [Op.in]: commentIds,
        },
      },
    });
  }
}
