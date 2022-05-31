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
import { ExceptionHelper } from '../../common/helpers';
import { Op } from 'sequelize';
import { SentryService } from '../../../libs/sentry/src';
import { ISeries, SeriesModel } from '../../database/models/series.model';

const slugify = require('slugify');

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
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Get Series
   * @throws HttpException
   * @param getSeriesDto GetSeriesDto
   * @returns Promise resolve PageDto<SeriesResponseDto>
   */
  public async getSeries(getSeriesDto: GetSeriesDto): Promise<PageDto<SeriesResponseDto>> {
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
  public async getSeriesById(id: string): Promise<SeriesResponseDto> {
    try {
      const series = await this._seriesModel.findOne<SeriesModel>({
        where: { id: id },
      });
      const jsonSeries = series.toJSON();
      const result = this._classTransformer.plainToInstance(SeriesResponseDto, jsonSeries, {
        excludeExtraneousValues: true,
      });
      return result;
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
  public async createSeries(
    authUser: UserDto,
    createSeriesDto: CreateSeriesDto
  ): Promise<SeriesResponseDto> {
    let transaction;
    try {
      const { name, active } = createSeriesDto;
      const slug = slugify(name);
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
      }
      transaction = await this._sequelizeConnection.transaction();
      const series = await this._seriesModel.create(
        {
          name,
          active,
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
  public async updateSeries(
    authUser: UserDto,
    seriesId: string,
    updateSeriesDto: UpdateSeriesDto
  ): Promise<boolean> {
    let transaction;
    try {
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
      }
      const seriesBefore = await this.getSeriesById(seriesId);
      await this.checkSeriesOwner(seriesBefore, authUserId);
      const { name, active } = updateSeriesDto;
      const slug = slugify(name);
      transaction = await this._sequelizeConnection.transaction();
      const dataUpdate = {
        name,
        active,
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
  public async deleteSeries(authUser: UserDto, seriesId: string): Promise<boolean> {
    let transaction;
    try {
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
      }
      const series = await this.getSeriesById(seriesId);
      await this.checkSeriesOwner(series, authUserId);
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
  public async checkSeriesOwner(
    series: SeriesResponseDto | SeriesModel | ISeries,
    authUserId: number
  ): Promise<boolean> {
    if (!series) {
      throw new LogicException(HTTP_STATUS_ID.APP_SERIES_NOT_FOUND);
    }

    if (series.createdBy !== authUserId) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
    return true;
  }
}
