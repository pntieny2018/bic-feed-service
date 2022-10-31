import { OrderEnum, PageDto } from '../../common/dto';
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
import { IPost, PostModel } from '../../database/models/post.model';
import { PostGroupModel } from '../../database/models/post-group.model';

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

    @InjectModel(PostGroupModel)
    private _postGroupModel: typeof PostGroupModel,
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Get Series
   * @throws HttpException
   * @param getSeriesDto GetSeriesDto
   * @returns Promise resolve PageDto<SeriesResponseDto>
   */
  public async get(
    articleId: string,
    authUser: UserDto,
    getArticleDto?: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const attributes = this.getAttributesObj({
      loadMarkRead: true,
      authUserId: authUser?.id || null,
    });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: true,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      shouldIncludeCategory: true,
      shouldIncludeSeries: true,
      shouldIncludePreviewLink: true,
      shouldIncludeCover: true,
      authUserId: authUser?.id || null,
    });

    let condition;
    if (authUser) {
      condition = {
        id: articleId,
        isArticle: true,
        [Op.or]: [{ isDraft: false }, { isDraft: true, createdBy: authUser.id }],
      };
    } else {
      condition = { id: articleId, isArticle: true };
    }

    const article = await this.postModel.findOne({
      attributes,
      where: condition,
      include,
    });

    if (!article) {
      throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    }
    if (authUser) {
      await this.authorityService.checkCanReadArticle(authUser, article);
    } else {
      await this.authorityService.checkIsPublicArticle(article);
    }
    let comments = null;
    if (getArticleDto.withComment) {
      comments = await this.commentService.getComments(
        {
          postId: articleId,
          parentId: NIL,
          childLimit: getArticleDto.childCommentLimit,
          order: getArticleDto.commentOrder,
          childOrder: getArticleDto.childCommentOrder,
          limit: getArticleDto.commentLimit,
        },
        authUser,
        false
      );
    }
    const jsonArticle = article.toJSON();
    const articlesBindedData = await this.articleBinding.bindRelatedData([jsonArticle], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, articlesBindedData, {
      excludeExtraneousValues: true,
    });
    result[0]['comments'] = comments;
    return result[0];
  }

  /**
   * Get Series By Id
   * @throws HttpException
   * @param id string
   * @returns Promise resolve SeriesResponseDto
   */
  public async getById(id: string): Promise<SeriesResponseDto> {
    try {
      const series = await this._postModel.findOne<PostModel>({
        where: { id: id },
      });
      const jsonSeries = series.toJSON();
      return this._classTransformer.plainToInstance(SeriesResponseDto, jsonSeries, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
      throw error;
    }
  }

  /**
   * Create Series
   * @param authUser UserDto
   * @param createSeriesDto CreateSeriesDto
   * @returns Promise resolve boolean
   * @throws HttpException
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
          cover: coverMedia.id,
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
   * Create Series
   * @param authUser UserDto
   * @param seriesId string
   * @param updateSeriesDto UpdateSeriesDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async update(
    authUser: UserDto,
    seriesId: string,
    updateSeriesDto: UpdateSeriesDto
  ): Promise<boolean> {
    return true;
  }

  /**
   * Delete Series
   * @param authUser UserDto
   @param seriesId string
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async delete(authUser: UserDto, seriesId: string): Promise<boolean> {
    let transaction;
    try {
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_EXISTING);
      }
      const series = await this.getById(seriesId);
      transaction = await this._sequelizeConnection.transaction();
      await this._postModel.destroy({
        where: {
          id: series.id,
          createdBy: authUserId,
        },
        transaction,
      });
      await transaction.commit();
      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
      throw error;
    }
  }

  /**
   * Add post to series
   * @param seriesIds Array of Series ID
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
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
   * @param seriesIds Array of Series ID
   * @param postId PostID
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
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

  public async checkValid(seriesIds: string[], userId: string): Promise<void> {
    const seriesCount = await this._postModel.count({
      where: {
        id: seriesIds,
        createdBy: userId,
      },
    });
    if (seriesCount < seriesIds.length) {
      throw new LogicException(HTTP_STATUS_ID.APP_SERIES_INVALID_PARAMETER);
    }
  }

  public async updateTotalArticle(seriesIds: string[]): Promise<void> {
    if (seriesIds.length === 0) return;
   // return SeriesModel.updateTotalArticle(seriesIds);
  }
}
