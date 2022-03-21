import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { UserDto } from '../auth';
import { PostAllow } from '../post';
import { MentionService } from '../mention';
import { UserService } from '../../shared/user';
import { GroupService } from '../../shared/group';
import { Sequelize } from 'sequelize-typescript';
import { CreateCommentDto } from './dto/requests';
import { plainToInstance } from 'class-transformer';
import { MentionableType } from '../../common/constants';
import { GetCommentDto } from './dto/requests/get-comment.dto';
import { MediaModel } from '../../database/models/media.model';
import { PageDto } from '../../common/dto/pagination/page.dto';
import { PostPolicyService } from '../post/post-policy.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../../database/models/comment.model';
import { MentionModel } from '../../database/models/mention.model';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { CommentResponseDto } from './dto/response/comment.response.dto';
import { AuthorityService } from '../authority';

@Injectable()
export class CommentService {
  private _logger = new Logger(CommentService.name);

  public constructor(
    private _userService: UserService,
    private _groupService: GroupService,
    private _mentionService: MentionService,
    private _authorityService: AuthorityService,
    private _postPolicyService: PostPolicyService,
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel
  ) {}

  /**
   * Create new comment
   * @param user Auth user
   * @param createCommentDto Create Comment Dto
   * @param replyId Reply comment id
   * @return Promise resolve CommentModel
   */
  public async create(
    user: UserDto,
    createCommentDto: CreateCommentDto,
    replyId?: number
  ): Promise<CommentResponseDto> {
    // check user can access
    const post = await this._authorityService.allowAccess(user, {
      postId: createCommentDto.postId,
    });
    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    const transaction = await this._sequelizeConnection.transaction();

    try {
      const comment = await this._commentModel.create({
        createdBy: user.id,
        parentId: replyId ? replyId : 0,
        content: createCommentDto.data.content,
        postId: createCommentDto.postId,
      });

      const usersMentions = createCommentDto?.mentions ?? [];

      if (usersMentions.length) {
        //TODO: check valid mention
        await this._mentionService.create(
          usersMentions.map((user) => ({
            entityId: comment.id,
            userId: user.id,
            mentionableType: MentionableType.COMMENT,
          }))
        );
      }

      const media = [
        ...createCommentDto.data.files,
        ...createCommentDto.data.images,
        ...createCommentDto.data.videos,
      ];
      //TODO : check is owner of media
      if (media.length) {
        await comment.addMedia(media.map((m) => m.id));
      }

      const commentResponse = await this.getComment(comment.id);

      await transaction.commit();

      return commentResponse;
    } catch (ex) {
      await transaction.rollback();
      throw new InternalServerErrorException("Can't create comment");
    }
  }

  public async update(
    user: UserDto,
    commentId: number,
    updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.log('update comment');

    // check user can access
    const post = await this._authorityService.allowAccess(user, {
      commentId: commentId,
    });
    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    const transaction = await this._sequelizeConnection.transaction();

    try {
      const comment = await this._commentModel.update(
        {
          updatedBy: user.id,
          content: updateCommentDto.data.content,
        },
        {
          where: {
            id: commentId,
            createdBy: user.id,
          },
        }
      );

      const usersMentions = updateCommentDto?.mentions ?? [];

      // if (usersMentions.length) {
      //   //TODO: check valid mention
      //   await this._mentionService.create(
      //     usersMentions.map((user) => ({
      //       entityId: comment.id,
      //       userId: user.userId,
      //       mentionableType: MentionableType.COMMENT,
      //     }))
      //   );
      // }
      //
      // const media = [
      //   ...createCommentDto.data.files,
      //   ...createCommentDto.data.images,
      //   ...createCommentDto.data.videos,
      // ];
      // //TODO : check is owner of media
      // if (media.length) {
      //   await comment.addMedia(media.map((m) => m.id));
      // }

      const commentResponse = await this.getComment(commentId);

      await transaction.commit();

      return commentResponse;
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
      await transaction.rollback();
      throw ex;
    }
  }

  /**
   * Get comment
   * @param commentID
   */
  public async getComment(commentID: number): Promise<CommentResponseDto> {
    this._logger.debug(`get comment with id: ${commentID}`);

    const response = await this._commentModel.findOne({
      where: {
        id: commentID,
      },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
        },
        {
          model: MentionModel,
        },
      ],
    });

    const rawComment = response.toJSON();
    await this._mentionService.bindMentionsToComment([rawComment]);
    await this._userService.bindUserToComment([rawComment]);

    return plainToInstance(CommentResponseDto, rawComment);
  }

  /**
   * Get list comment
   * @param user UserDto
   * @param getCommentDto GetCommentDto
   */
  public async getComments(
    user: UserDto,
    getCommentDto: GetCommentDto
  ): Promise<PageDto<CommentResponseDto>> {
    const conditions = {};
    const offset = {};

    conditions['parentId'] = getCommentDto?.parentId ?? 0;

    if (conditions['parentId']) {
      await this._authorityService.allowAccess(user, {
        commentId: getCommentDto.parentId,
      });
    }

    if (getCommentDto.postId) {
      await this._authorityService.allowAccess(user, {
        postId: getCommentDto.postId,
      });

      conditions['postId'] = getCommentDto.postId;
    }
    if (getCommentDto.offset) {
      offset['offset'] = getCommentDto.offset;
    }
    if (getCommentDto.idGT) {
      await this._authorityService.allowAccess(user, {
        commentId: getCommentDto.idGT + 1,
      });

      conditions['id'] = {
        [Op.gt]: getCommentDto.idGT,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idGTE) {
      await this._authorityService.allowAccess(user, {
        commentId: getCommentDto.idGTE,
      });

      conditions['id'] = {
        [Op.gte]: getCommentDto.idGTE,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idLT) {
      await this._authorityService.allowAccess(user, {
        commentId: getCommentDto.idLT - 1,
      });

      conditions['id'] = {
        [Op.lt]: getCommentDto.idLT,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idLTE) {
      await this._authorityService.allowAccess(user, {
        commentId: getCommentDto.idLTE,
      });

      conditions['id'] = {
        [Op.lte]: getCommentDto.idLTE,
        ...conditions['id'],
      };
    }

    if (
      !getCommentDto.idGT &&
      !getCommentDto.idGTE &&
      !getCommentDto.idLT &&
      !getCommentDto.idLTE &&
      !getCommentDto.parentId &&
      !getCommentDto.postId
    ) {
      throw new BadRequestException(
        `You need to enter a value for one of the following properties: commentId, postId`
      );
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
          association: 'ownerReactions',
          required: false,
          where: {
            createdBy: 1,
          },
        },
      ],
      ...offset,
      limit: getCommentDto.limit,
      order: [['createdAt', getCommentDto.order]],
    });
    const response = rows.map((r) => r.toJSON());
    await this._mentionService.bindMentionsToComment(response);
    await this._userService.bindUserToComment(response);
    const comments = plainToInstance(CommentResponseDto, response, {
      excludeExtraneousValues: true,
    });

    return new PageDto<CommentResponseDto>(comments, {
      total: count,
      limit: getCommentDto.limit,
      ...offset,
    });
  }

  /**
   * Delete comment
   * @param user
   * @param commentID
   */
  public async destroy(user: UserDto, commentID: number): Promise<number> {
    this._logger.log('delete comment');

    return await this._commentModel.destroy({
      where: {
        id: commentID,
        createdBy: user.id,
      },
    });
  }
}
