import { HTTP_STATUS_ID } from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from './dto/requests';
import { Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { Sequelize } from 'sequelize-typescript';
import { SeriesResponseDto } from './dto/responses';
import { ClassTransformer } from 'class-transformer';
import { LogicException } from '../../common/exceptions';
import { ArrayHelper, ExceptionHelper } from '../../common/helpers';
import { Op, Transaction } from 'sequelize';
import { SentryService } from '@app/sentry';
import { PostSeriesModel } from '../../database/models/post-series.model';
import { IPost, PostModel, PostType } from '../../database/models/post.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { MediaModel } from '../../database/models/media.model';
import { AuthorityService } from '../authority';
import { CommentService } from '../comment';
import { NIL } from 'uuid';
import { PostBindingService } from '../post/post-binding.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { FeedService } from '../feed/feed.service';
import { ReactionService } from '../reaction';
import { UserSavePostModel } from '../../database/models/user-save-post.model';
import { GetSeriesSavedDto } from './dto/requests/get-series-saved.dto';
import { PageDto } from '../../common/dto';
import { PostResponseDto } from '../post/dto/responses';

@Injectable()
export class SeriesService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(SeriesService.name);

  /**
   *  ClassTransformer
   * @private
   */
  private _classTransformer = new ClassTransformer();

  public constructor(
    @InjectConnection()
    private _sequelizeConnection: Sequelize,

    @InjectModel(PostModel)
    private _postModel: typeof PostModel,
    @InjectModel(PostSeriesModel)
    private _postSeriesModel: typeof PostSeriesModel,

    @InjectModel(UserMarkReadPostModel)
    private _userMarkReadPostModel: typeof UserMarkReadPostModel,

    @InjectModel(PostGroupModel)
    private _postGroupModel: typeof PostGroupModel,

    @InjectModel(UserSavePostModel)
    private _userSavePostModel: typeof UserSavePostModel,

    private _authorityService: AuthorityService,
    private readonly _sentryService: SentryService,
    private readonly _commentService: CommentService,
    private readonly _postBinding: PostBindingService,
    private readonly _feedService: FeedService,
    private readonly _reactionService: ReactionService
  ) {}

  /**
   * Get Series
   */
  public async get(
    id: string,
    authUser: UserDto,
    getSeriesDto?: GetSeriesDto
  ): Promise<SeriesResponseDto> {
    let condition;
    if (authUser) {
      condition = {
        id,
        type: PostType.SERIES,
        [Op.or]: [{ isDraft: false }, { isDraft: true, createdBy: authUser.id }],
      };
    } else {
      condition = { id, type: PostType.SERIES };
    }

    const series = await this._postModel.findOne({
      attributes: {
        include: [PostModel.loadMarkReadPost(authUser.id), PostModel.loadSaved(authUser.id)],
      },
      where: condition,
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId'],
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: authUser.id,
          },
        },
        {
          model: MediaModel,
          as: 'coverMedia',
          required: false,
        },
      ],
    });

    if (!series) {
      throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    }
    if (authUser) {
      await this._authorityService.checkCanReadSeries(authUser, series);
    } else {
      await this._authorityService.checkIsPublicSeries(series);
    }
    let comments = null;
    if (getSeriesDto.withComment) {
      comments = await this._commentService.getComments(
        {
          postId: id,
          parentId: NIL,
          childLimit: getSeriesDto.childCommentLimit,
          order: getSeriesDto.commentOrder,
          childOrder: getSeriesDto.childCommentOrder,
          limit: getSeriesDto.commentLimit,
        },
        authUser,
        false
      );
    }
    const jsonArticle = series.toJSON();
    const seriesBindedData = await this._postBinding.bindRelatedData([jsonArticle], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    const result = this._classTransformer.plainToInstance(SeriesResponseDto, seriesBindedData, {
      excludeExtraneousValues: true,
    });
    result[0]['comments'] = comments;
    return result[0];
  }
  /**
   * Create Series
   */
  public async create(authUser: UserDto, createPostDto: CreateSeriesDto): Promise<IPost> {
    let transaction;
    try {
      const { title, summary, audience, coverMedia } = createPostDto;
      const authUserId = authUser.id;
      transaction = await this._sequelizeConnection.transaction();
      const post = await this._postModel.create(
        {
          title,
          summary,
          createdBy: authUserId,
          updatedBy: authUserId,
          isDraft: false,
          isProcessing: false,
          cover: coverMedia.id,
          type: PostType.SERIES,
        },
        { transaction }
      );

      if (audience.groupIds.length > 0) {
        await this.addGroup(audience.groupIds, post.id, transaction);
      }

      await transaction.commit();

      return post;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
      throw error;
    }
  }

  public async addGroup(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (groupIds.length === 0) return;
    const postGroupDataCreate = groupIds.map((groupId) => ({
      postId: postId,
      groupId,
    }));
    await this._postGroupModel.bulkCreate(postGroupDataCreate, { transaction });
  }

  /**
   * Update Series
   */
  public async update(
    post: SeriesResponseDto,
    authUser: UserDto,
    updateSeriesDto: UpdateSeriesDto
  ): Promise<boolean> {
    const authUserId = authUser.id;
    let transaction;
    try {
      const { audience, title, summary, coverMedia } = updateSeriesDto;
      transaction = await this._sequelizeConnection.transaction();
      await this._postModel.update(
        {
          updatedBy: authUserId,
          title,
          summary,
          cover: coverMedia.id,
        },
        {
          where: {
            id: post.id,
            createdBy: authUserId,
          },
          transaction,
        }
      );

      const oldGroupIds = post.audience.groups.map((group) => group.id);
      if (audience.groupIds && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
        await this.setGroupByPost(audience.groupIds, post.id, transaction);
      }
      await transaction.commit();

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Delete/Insert group by post
   */
  public async setGroupByPost(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<boolean> {
    const currentGroups = await this._postGroupModel.findAll({
      where: { postId },
    });
    const currentGroupIds = currentGroups.map((i) => i.groupId);

    const deleteGroupIds = ArrayHelper.arrDifferenceElements(currentGroupIds, groupIds);
    if (deleteGroupIds.length) {
      await this._postGroupModel.destroy({
        where: { groupId: deleteGroupIds, postId },
        transaction,
      });
    }

    const addGroupIds = ArrayHelper.arrDifferenceElements(groupIds, currentGroupIds);
    if (addGroupIds.length) {
      await this._postGroupModel.bulkCreate(
        addGroupIds.map((groupId) => ({
          postId,
          groupId,
        })),
        { transaction }
      );
    }
    return true;
  }

  /**
   * Delete Series
   */
  public async delete(authUser: UserDto, seriesId: string): Promise<IPost> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const series = await this._postModel.findOne({
        where: {
          id: seriesId,
        },
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
            attributes: ['groupId'],
          },
        ],
      });

      if (!series) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
      }
      if (series.isDraft === false) {
        await this._authorityService.checkCanDeletePost(
          authUser,
          series.groups.map((g) => g.groupId),
          series.createdBy
        );
      }

      if (series.isDraft) {
        await Promise.all([
          this._postGroupModel.destroy({
            where: {
              postId: seriesId,
            },
          }),
          this._reactionService.deleteByPostIds([seriesId]),
          this._commentService.deleteCommentsByPost(seriesId, transaction),
          this._feedService.deleteNewsFeedByPost(seriesId, transaction),
          this._feedService.deleteUserSeenByPost(seriesId, transaction),
          this._postSeriesModel.destroy({ where: { postId: seriesId }, transaction }),
          this._userMarkReadPostModel.destroy({ where: { seriesId }, transaction }),
        ]);
        await this._postModel.destroy({
          where: {
            id: seriesId,
            createdBy: authUser.id,
          },
          transaction: transaction,
          force: true,
        });
      } else {
        await this._postModel.destroy({
          where: {
            id: seriesId,
            createdBy: authUser.id,
          },
          transaction: transaction,
        });
      }
      await transaction.commit();

      return series;
    } catch (error) {
      this._logger.error(error, error?.stack);
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Add post to series
   */
  public async addToPost(
    seriesIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (seriesIds.length === 0) return;
    const dataCreate = seriesIds.map((seriesId) => ({
      postId: postId,
      seriesId,
    }));
    await this._postSeriesModel.bulkCreate(dataCreate, { transaction });
  }

  /**
   * Delete/Insert series by post
   */
  public async updateToPost(
    seriesIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    const currentSeries = await this._postSeriesModel.findAll({
      where: { postId },
    });
    const currentSeriesIds = currentSeries.map((i) => i.seriesId);

    const deleteSeriesIds = ArrayHelper.arrDifferenceElements(currentSeriesIds, seriesIds);
    if (deleteSeriesIds.length) {
      await this._postSeriesModel.destroy({
        where: { seriesId: deleteSeriesIds, postId },
        transaction,
      });
    }

    const addSeriesIds = ArrayHelper.arrDifferenceElements(seriesIds, currentSeriesIds);
    if (addSeriesIds.length) {
      await this._postSeriesModel.bulkCreate(
        addSeriesIds.map((seriesId) => ({
          postId,
          seriesId,
        })),
        { transaction }
      );
    }
  }

  public async checkExistAndPublished(id: string): Promise<void> {
    const post = await this._postModel.findOne({
      where: {
        id,
        isDraft: false,
        type: PostType.SERIES,
      },
    });
    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }
  }

  public async getSeriesByIds(ids: string[], userId: string): Promise<IPost[]> {
    if (ids.length === 0) return [];
    const attributes = {
      include: [PostModel.loadMarkReadPost(userId)],
    };
    const rows = await this._postModel.findAll({
      attributes,
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: userId,
          },
        },
        {
          model: MediaModel,
          as: 'coverMedia',
          required: false,
        },
      ],
      where: {
        id: ids,
      },
    });

    const mappedPosts = ids.map((postId) => {
      const post = rows.find((row) => row.id === postId);
      if (post) return post.toJSON();
    });

    return mappedPosts;
  }
}
