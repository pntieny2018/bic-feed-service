import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { plainToClass } from 'class-transformer';
import { RecentSearchDto, RecentSearchesDto } from './dto/responses';
import { RecentSearchModel } from '../../database/models/recent-search.model';
import { CreateRecentSearchDto, GetRecentSearchPostDto } from './dto/requests';
import { LIMIT_TOTAL_RECENT_SEARCH, RecentSearchType } from './recent-search-type.constants';

@Injectable()
export class RecentSearchService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(RecentSearchService.name);

  public constructor(
    @InjectModel(RecentSearchModel)
    private _recentSearchModel: typeof RecentSearchModel //private _sentryService: SentryService
  ) {}

  /**
   * Get list recent search
   * @param createdBy number
   * @param getRecentSearchPostDto GetRecentSearchPostDto
   * @returns Promise resolve RecentSearchDto[] or []
   */
  public async get(
    createdBy: number,
    getRecentSearchPostDto: GetRecentSearchPostDto
  ): Promise<RecentSearchesDto> {
    const { limit, offset, target } = getRecentSearchPostDto;
    const filter = target === RecentSearchType.ALL ? {} : { target };
    try {
      const recentSearches = await this._recentSearchModel.findAll({
        raw: true,
        attributes: ['id', 'keyword'],
        where: {
          createdBy,
          ...filter,
        },
        limit: limit,
        offset,
        order: [['updatedAt', getRecentSearchPostDto.order]],
      });
      return plainToClass(
        RecentSearchesDto,
        { target, recentSearches: recentSearches },
        { excludeExtraneousValues: true }
      );
    } catch (error) {
      this._logger.error(error, error.stack);
      //this._sentryService.captureException(error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  /**
   * Create recent search
   * @param createdBy Number
   * @param createRecentSearchDto CreateRecentSearchDto
   * @returns Promise resolve recentSearchPostDto
   * @throws HttpException
   */
  public async create(
    createdBy: number,
    createRecentSearchDto: CreateRecentSearchDto
  ): Promise<RecentSearchDto> {
    try {
      createRecentSearchDto.target = createRecentSearchDto.target?.toLowerCase();
      createRecentSearchDto.keyword = createRecentSearchDto.keyword.toLowerCase();
      const [recentSearch, isCreated] = await this._recentSearchModel.findOrCreate({
        where: {
          keyword: createRecentSearchDto.keyword,
          createdBy,
          target: createRecentSearchDto.target,
        },
        defaults: {
          createdBy,
          updatedBy: createdBy,
          ...createRecentSearchDto,
        },
      });

      if (!isCreated) {
        recentSearch.changed('updatedAt', true);
        recentSearch.set({ totalSearched: recentSearch.totalSearched + 1 });
        await recentSearch.save();
      }
      // Check and delete if need
      await this.needDeleteRecentSearchOverLimit(createdBy);

      return plainToClass(RecentSearchDto, recentSearch, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this._logger.error(error, error?.stack);
      //this._sentryService.captureException(error);

      throw new HttpException("Can't create recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete recent search by id
   * @param createdBy Number
   * @param id Number
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async delete(createdBy: number, id: number): Promise<boolean> {
    try {
      await this._recentSearchModel.destroy({
        where: {
          id,
          createdBy,
        },
      });
      return true;
    } catch (error) {
      this._logger.error(error);
      //this._sentryService.captureException(error);

      throw new HttpException("Can't delete recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Clean recent search post
   * @param createdBy Number
   * @param target RecentSearchType
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async clean(createdBy: number, target: RecentSearchType): Promise<boolean> {
    try {
      const filter = target === RecentSearchType.ALL ? {} : { target: target };
      await this._recentSearchModel.destroy({
        where: {
          createdBy,
          ...filter,
        },
      });
      return true;
    } catch (error) {
      this._logger.log(error);
      //this._sentryService.captureException(error);

      throw new HttpException("Can't delete recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Need delete recent search item
   * If total stored recent search item are elder total accept (default: 1000000).
   * I will delete oldest stored recent search item
   * @param createdBy Number
   * @public
   */
  public async needDeleteRecentSearchOverLimit(createdBy: number): Promise<boolean> {
    const total = await this._recentSearchModel.count({
      col: 'id',
      where: {
        createdBy,
      },
    });
    if (total > LIMIT_TOTAL_RECENT_SEARCH) {
      const firstItem = await this._recentSearchModel.findOne({
        attributes: ['id'],
        where: {
          createdBy,
        },
        order: [['createdAt', 'asc']],
      });
      if (firstItem) {
        await this.delete(createdBy, firstItem.id);
        return true;
      }
    }
    return false;
  }
}
