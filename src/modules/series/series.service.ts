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
import { ISeries, SeriesModel } from '../../database/models/series.model';
import slugify from 'slugify';
import { PostSeriesModel } from '../../database/models/post-series.model';

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
    @InjectModel(SeriesModel)
    private _seriesModel: typeof SeriesModel,
    @InjectModel(PostSeriesModel)
    private _postSeriesModel: typeof PostSeriesModel,
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Get Series
   * @throws HttpException
   * @param getSeriesDto GetSeriesDto
   * @returns Promise resolve PageDto<SeriesResponseDto>
   */
  public async get(getSeriesDto: GetSeriesDto): Promise<PageDto<SeriesResponseDto>> {
    const { orderField, name, limit, offset } = getSeriesDto;

    try {
      const { rows, count } = await this._seriesModel.findAndCountAll<SeriesModel>({
        where: {
          name: {
            [Op.iLike]: '%' + name + '%',
          },
        },
        offset: offset,
        limit: limit,
        order: [[orderField, OrderEnum.DESC]],
      });

      const jsonSeries = rows.map((r) => r.toJSON());
      const result = this._classTransformer.plainToInstance(SeriesResponseDto, jsonSeries, {
        excludeExtraneousValues: true,
      });

      return new PageDto<SeriesResponseDto>(result, {
        total: count,
        limit,
        offset,
      });
    } catch (error) {
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
      throw error;
    }
  }

  /**
   * Get Series By Id
   * @throws HttpException
   * @param id string
   * @returns Promise resolve SeriesResponseDto
   */
  public async getById(id: string): Promise<SeriesResponseDto> {
    try {
      const series = await this._seriesModel.findOne<SeriesModel>({
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
  public async create(
    authUser: UserDto,
    createSeriesDto: CreateSeriesDto
  ): Promise<SeriesResponseDto> {
    let transaction;
    try {
      const { name, isActive } = createSeriesDto;
      const slug = slugify(name);
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_EXISTING);
      }
      transaction = await this._sequelizeConnection.transaction();
      const series = await this._seriesModel.create(
        {
          name,
          isActive,
          slug,
          createdBy: authUserId,
          updatedBy: authUserId,
        },
        { transaction }
      );

      await transaction.commit();
      return series;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
      throw error;
    }
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
    let transaction;
    try {
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_EXISTING);
      }
      const seriesBefore = await this.getById(seriesId);
      await this.checkOwner(seriesBefore, authUserId);
      const { name, isActive } = updateSeriesDto;
      const slug = slugify(name);
      transaction = await this._sequelizeConnection.transaction();
      const dataUpdate = {
        name,
        isActive,
        slug,
      };
      await this._seriesModel.update(dataUpdate, {
        where: {
          id: seriesBefore.id,
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
      await this.checkOwner(series, authUserId);
      transaction = await this._sequelizeConnection.transaction();
      await this._seriesModel.destroy({
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
   * Check series exist and owner
   * @param series SeriesResponseDto
   * @param authUserId Auth userID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async checkOwner(
    series: SeriesResponseDto | SeriesModel | ISeries,
    authUserId: string
  ): Promise<boolean> {
    if (!series) {
      throw new LogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }

    if (series.createdBy !== authUserId) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
    return true;
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
    const seriesCount = await this._seriesModel.count({
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
    return SeriesModel.updateTotalArticle(seriesIds);
  }
}
