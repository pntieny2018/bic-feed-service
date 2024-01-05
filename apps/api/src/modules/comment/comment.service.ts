import { CONTENT_TARGET } from '@beincom/constants';
import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { Op } from 'sequelize';
import { NIL as NIL_UUID } from 'uuid';

import { PageDto } from '../../common/dto';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { AuthorityService } from '../authority';
import { GiphyService } from '../giphy';
import { createUrlFromId } from '../giphy/giphy.util';
import { MentionService } from '../mention';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import { CommentNotFoundException } from '../v2-post/domain/exception';

import { GetCommentsDto } from './dto/requests';
import { CommentResponseDto } from './dto/response';

@Injectable()
export class CommentService {
  private _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(forwardRef(() => PostService))
    private _postService: PostService,
    @Inject(USER_SERVICE_TOKEN)
    private _userAppService: IUserService,
    private _mentionService: MentionService,
    private _reactionService: ReactionService,
    private _authorityService: AuthorityService,
    private _giphyService: GiphyService,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel
  ) {}

  /**
   * Get single comment
   */
  public async getComment(
    user: UserDto,
    commentId: string,
    childLimit = 0
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
      throw new CommentNotFoundException();
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
    return result;
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
        CONTENT_TARGET.POST,
        CONTENT_TARGET.ARTICLE,
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

  private async _getComments(
    getCommentsDto: GetCommentsDto,
    authUserId?: string
  ): Promise<PageDto<CommentResponseDto>> {
    const { limit } = getCommentsDto;
    const rows: any[] = await CommentModel.getList(getCommentsDto, authUserId);
    const childGrouped = this._groupComments(rows);
    const hasNextPage = childGrouped.length === limit + 1;
    if (hasNextPage) {
      childGrouped.pop();
    }
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
      if (hasNextPage) {
        childList.pop();
      }
      comment.child = new PageDto<CommentResponseDto>(childList, {
        limit,
        offset: 0,
        hasNextPage,
        hasPreviousPage: false,
      });
    }
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
            model: CommentReactionModel,
            as: 'ownerReactions',
            required: false,
          },
        ],
      });
    };
    const response = await get(commentId);

    if (!response) {
      throw new CommentNotFoundException();
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
        mentions,
        totalReply,
        createdBy,
        updatedBy,
        createdAt,
        updatedAt,
      } = comment;
      const commentAdded = result.find((i) => i.id === comment.id);
      if (!commentAdded) {
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
