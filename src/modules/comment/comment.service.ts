import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { Op } from 'sequelize';
import { UserDto } from '../auth';
import { PostAllow } from '../post';
import { MediaService } from '../media';
import { PageDto } from '../../common/dto';
import { MentionService } from '../mention';
import { UserService } from '../../shared/user';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { EntityType } from '../media/media.constants';
import { MentionableType } from '../../common/constants';
import { UserDataShareDto } from '../../shared/user/dto';
import { MediaModel } from '../../database/models/media.model';
import { PostPolicyService } from '../post/post-policy.service';
import { CreateCommentDto, GetCommentDto } from './dto/requests';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { CommentResponseDto } from './dto/response/comment.response.dto';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { PostModel } from '../../database/models/post.model';
import { ExceptionHelper } from '../../common/helpers';
import { DeleteReactionService } from '../reaction/services';

@Injectable()
export class CommentService {
  private _logger = new Logger(CommentService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(forwardRef(() => PostService))
    private _postService: PostService,
    private _userService: UserService,
    private _mediaService: MediaService,
    private _groupService: GroupService,
    private _mentionService: MentionService,
    private _authorityService: AuthorityService,
    private _postPolicyService: PostPolicyService,
    private _deleteReactionService: DeleteReactionService,
    private _eventEmitter: InternalEventEmitterService,
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel
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

    if (replyId > 0) {
      const parentComment = await this._commentModel.findOne({
        include: [{ model: PostModel, as: 'post' }],
        where: {
          id: replyId,
        },
      });
      post = parentComment.post;

      if (!parentComment || !post) {
        ExceptionHelper.throwBadRequestException(`Reply comment not found`);
      }
    } else {
      post = await this._postService.findPost({
        postId: createCommentDto.postId,
      });
    }

    // check user can access
    this._authorityService.allowAccess(user, post);

    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    const transaction = await this._sequelizeConnection.transaction();
    try {
      const comment = await this._commentModel.create({
        createdBy: user.id,
        updatedBy: user.id,
        parentId: replyId,
        content: createCommentDto.content,
        postId: post.id,
      });

      const usersMentions = createCommentDto.mentions;

      if (usersMentions.length) {
        const userMentionIds = usersMentions.map((u) => u.id);
        const groupAudienceIds = post.groups.map((g) => g.groupId);

        await this._mentionService.checkValidMentions(groupAudienceIds, userMentionIds);

        await this._mentionService.create(
          usersMentions.map((user) => ({
            entityId: comment.id,
            userId: user.id,
            mentionableType: MentionableType.COMMENT,
          }))
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

        await this._mediaService.sync(comment.id, EntityType.COMMENT, mediaIds);
      }

      const commentResponse = await this.getComment(user, comment.id);

      await transaction.commit();

      this._eventEmitter.emit(
        new CommentHasBeenCreatedEvent({
          comment: comment,
          post: post,
        })
      );

      return commentResponse;
    } catch (ex) {
      await transaction.rollback();

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
      throw new BadRequestException(`Comment ${commentId} not found`);
    }

    const post = await this._postService.findPost({
      postId: comment.postId,
    });

    // check user can access
    this._authorityService.allowAccess(user, post);

    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    const transaction = await this._sequelizeConnection.transaction();

    try {
      await comment.update({
        updatedBy: user.id,
        content: updateCommentDto.content,
      });
      const updateMentions = updateCommentDto.mentions;

      const userMentionIds = updateMentions.map((u) => u.id);
      if (userMentionIds.length) {
        const groupAudienceIds = post.groups.map((g) => g.groupId);
        await this._mentionService.checkValidMentions(groupAudienceIds, userMentionIds);
      }
      await this._mentionService.setMention(userMentionIds, MentionableType.COMMENT, comment.id);

      const media = [
        ...updateCommentDto.media.files,
        ...updateCommentDto.media.images,
        ...updateCommentDto.media.videos,
      ];

      const mediaIds = media.map((m) => m.id);
      if (mediaIds.length) {
        await this._mediaService.checkValidMedia(mediaIds, user.id);
      }
      await this._mediaService.sync(comment.id, EntityType.COMMENT, mediaIds);

      const commentResponse = await this.getComment(user, commentId);

      await transaction.commit();

      this._eventEmitter.emit(
        new CommentHasBeenUpdatedEvent({
          comment: comment,
          post: post,
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
    this._logger.debug(`[getComment] ,commentId: ${commentId} `);

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
      throw new BadRequestException(`Comment ${commentId} not found`);
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
   * @param getCommentDto GetCommentDto
   * @param checkAccess Boolean
   * @returns Promise resolve PageDto<CommentResponseDto>
   */
  public async getComments(
    user: UserDto,
    getCommentDto: GetCommentDto,
    checkAccess = true
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug(
      `[getComments] user: ${JSON.stringify(user)}, getCommentDto: ${JSON.stringify(getCommentDto)}`
    );

    const conditions = {};
    const offset = {};

    if (checkAccess) {
      const post = await this._postService.findPost({
        postId: getCommentDto.postId,
      });

      await this._authorityService.allowAccess(user, post);
    }

    conditions['postId'] = getCommentDto.postId;

    conditions['parentId'] = getCommentDto.parentId ?? 0;

    if (getCommentDto.offset || getCommentDto.offset === 0) {
      offset['offset'] = getCommentDto.offset;
    }
    if (getCommentDto.idGT) {
      conditions['id'] = {
        [Op.gt]: getCommentDto.idGT,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idGTE) {
      conditions['id'] = {
        [Op.gte]: getCommentDto.idGTE,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idLT) {
      conditions['id'] = {
        [Op.lt]: getCommentDto.idLT,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idLTE) {
      conditions['id'] = {
        [Op.lte]: getCommentDto.idLTE,
        ...conditions['id'],
      };
    }

    const { rows, count } = await this._commentModel.findAndCountAll({
      where: {
        ...conditions,
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
          required: false,
        },
        {
          model: CommentModel,
          limit: getCommentDto.childLimit,
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
      ...offset,
      limit: getCommentDto.limit,
      order: [['createdAt', getCommentDto.order]],
    });
    const response = rows.map((r) => r.toJSON());
    await this._mentionService.bindMentionsToComment(response);

    await this.bindUserToComment(response);

    const comments = this._classTransformer.plainToInstance(CommentResponseDto, response, {
      excludeExtraneousValues: true,
    });

    return new PageDto<CommentResponseDto>(comments, {
      total: count,
      limit: getCommentDto.limit,
      ...offset,
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
      throw new BadRequestException(`Comment ${commentId} not found`);
    }

    const post = await this._postService.findPost({
      commentId: commentId,
    });

    await this._authorityService.allowAccess(user, post);

    const transaction = await this._sequelizeConnection.transaction();

    try {
      await this._mediaService.sync(commentId, EntityType.COMMENT, []);

      await this._mentionService.destroy({
        commentId: commentId,
      });

      await comment.destroy();

      await transaction.commit();

      this._eventEmitter.emit(
        new CommentHasBeenDeletedEvent({
          comment: comment,
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
   * Count total number of comments by PostID
   * @param postId number
   * @returns Promise resolve number
   */
  public async getCommentCountByPost(postId: number): Promise<number> {
    return await this._commentModel.count({
      where: { postId },
    });
  }

  /**
   * Delete all comments by postID
   * @param postId number
   * @returns Promise resolve boolean
   */
  public async deleteCommentsByPost(postId: number): Promise<void> {
    const comments = await this._commentModel.findAll({
      where: { postId },
    });
    const commentIds = comments.map((i) => i.id);
    await this._mediaService.deleteMediaByEntityIds(commentIds, EntityType.COMMENT);
    await this._mentionService.deleteMentionByEntityIds(commentIds, MentionableType.COMMENT);
    await this._deleteReactionService.deleteReactionByCommentIds(commentIds);
    await this._commentModel.destroy({
      where: { id: commentIds },
    });
  }
}
