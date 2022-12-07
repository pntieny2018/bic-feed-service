import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PageDto } from '../../../common/dto';
import { ExceptionHelper } from '../../../common/helpers';
import {
  SeriesHasBeenDeletedEvent,
  SeriesHasBeenPublishedEvent,
  SeriesHasBeenUpdatedEvent,
} from '../../../events/series';
import { SeriesSearchResponseDto } from '../../article/dto/responses/series-search.response.dto';
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { FeedService } from '../../feed/feed.service';
import { PostService } from '../../post/post.service';
import { SearchService } from '../../search/search.service';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from '../dto/requests';
import { SearchSeriesDto } from '../dto/requests/search-series.dto';
import { SeriesResponseDto } from '../dto/responses';
import { SeriesService } from '../series.service';

@Injectable()
export class SeriesAppService {
  private _logger = new Logger(SeriesAppService.name);
  public constructor(
    private _seriesService: SeriesService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _feedService: FeedService,
    private _postSearchService: SearchService,
    private _postService: PostService
  ) {}

  public async searchSeries(
    user: UserDto,
    searchDto: SearchSeriesDto
  ): Promise<PageDto<SeriesSearchResponseDto>> {
    return this._postSearchService.searchSeries(user, searchDto);
  }

  public async getSeriesDetail(
    user: UserDto,
    postId: string,
    getSeriesDto: GetSeriesDto
  ): Promise<SeriesResponseDto> {
    getSeriesDto.hideSecretAudienceCanNotAccess = true;
    const post = await this._seriesService.get(postId, user, getSeriesDto);
    if (user) {
      this._feedService.markSeenPosts(postId, user.id).catch((ex) => {
        this._logger.error(ex, ex.stack);
      });
    }

    return post;
  }

  public async createSeries(user: UserDto, createSeriesDto: CreateSeriesDto): Promise<any> {
    const { audience } = createSeriesDto;
    if (audience.groupIds?.length > 0) {
      await this._authorityService.checkCanCreateSeries(user, audience.groupIds);
    }
    const created = await this._seriesService.create(user, createSeriesDto);
    if (created) {
      const series = await this._seriesService.get(created.id, user, new GetSeriesDto());
      this._eventEmitter.emit(
        new SeriesHasBeenPublishedEvent({
          series,
          actor: user.profile,
        })
      );
      return series;
    }
  }

  public async updateSeries(
    user: UserDto,
    postId: string,
    updateSeriesDto: UpdateSeriesDto
  ): Promise<SeriesResponseDto> {
    const { audience } = updateSeriesDto;
    const seriesBefore = await this._seriesService.get(postId, user, new GetSeriesDto());

    if (!seriesBefore) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    await this._authorityService.checkPostOwner(seriesBefore, user.id);

    if (audience.groupIds.length === 0) {
      throw new BadRequestException('Audience is required');
    }

    const oldGroupIds = seriesBefore.audience.groups.map((group) => group.id);
    await this._authorityService.checkCanUpdateSeries(user, oldGroupIds);
    this._authorityService.checkUserInSomeGroups(user, oldGroupIds);
    const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
    if (newAudienceIds.length) {
      await this._authorityService.checkCanCreateSeries(user, newAudienceIds);
    }
    const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
    if (removeGroupIds.length) {
      await this._authorityService.checkCanDeleteSeries(user, removeGroupIds);
    }

    const isUpdated = await this._seriesService.update(seriesBefore, user, updateSeriesDto);
    if (isUpdated) {
      const seriesUpdated = await this._seriesService.get(postId, user, new GetSeriesDto());
      this._eventEmitter.emit(
        new SeriesHasBeenUpdatedEvent({
          oldSeries: seriesBefore,
          newSeries: seriesUpdated,
          actor: user.profile,
        })
      );

      return seriesUpdated;
    }
  }

  public async deleteSeries(user: UserDto, seriesId: string): Promise<boolean> {
    const series = await this._postService.getListWithGroupsByIds([seriesId], false);
    if (series.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }
    await this._authorityService.checkPostOwner(series[0], user.id);

    if (series[0].isDraft === false) {
      await this._authorityService.checkCanDeleteSeries(
        user,
        series[0].groups.map((g) => g.groupId)
      );
    }

    const seriesDeleted = await this._seriesService.delete(user, series[0]);
    if (seriesDeleted) {
      this._eventEmitter.emit(
        new SeriesHasBeenDeletedEvent({
          series: seriesDeleted,
          actor: user.profile,
        })
      );
      return true;
    }
    return false;
  }

  public async removeArticles(
    seriesId: string,
    articleIds: string[],
    user: UserDto
  ): Promise<void> {
    const series = await this._postService.getListWithGroupsByIds([seriesId], false);
    if (series.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }
    await this._authorityService.checkPostOwner(series[0], user.id);
    await this._authorityService.checkCanUpdateSeries(
      user,
      series[0].groups.map((group) => group.groupId)
    );
    await this._seriesService.removeArticles(series[0], articleIds);
  }

  public async addArticles(seriesId: string, articleIds: string[], user: UserDto): Promise<void> {
    const series = await this._postService.getListWithGroupsByIds([seriesId], false);

    if (series.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }

    if (series[0].groups.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_GROUP_REQUIRED);
    }

    await this._authorityService.checkPostOwner(series[0], user.id);

    const seriesGroupIds = series[0].groups.map((group) => group.groupId);
    const articles = await this._postService.getListWithGroupsByIds(articleIds, false);

    if (articles.length < articleIds.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_VALIDATION_ERROR,
        message: `Articles parameter is invalid`,
      });
    }

    await this._authorityService.checkCanUpdateSeries(
      user,
      series[0].groups.map((group) => group.groupId)
    );

    const invalidArticles = [];

    for (const article of articles) {
      if (article.groups.length === 0) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_GROUP_REQUIRED);
      }

      const isValid = article.groups.some((group) => seriesGroupIds.includes(group.groupId));
      if (!isValid) {
        invalidArticles.push(article);
      }
    }
    if (invalidArticles.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You can not add articles: ${invalidArticles.map((e) => e.title).join(', ')}`,
        errors: { seriesDenied: invalidArticles.map((e) => e.id) },
      });
    }

    await this._seriesService.addArticles(series[0], articleIds);
  }

  public async reorderArticles(
    seriesId: string,
    articleIds: string[],
    user: UserDto
  ): Promise<void> {
    const series = await this._seriesService.findSeriesById(seriesId, {
      withGroups: true,
    });
    if (!series) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    await this._authorityService.checkPostOwner(series, user.id);
    await this._authorityService.checkCanUpdateSeries(
      user,
      series[0].groups.map((group) => group.groupId)
    );
    return this._seriesService.reorderArticles(seriesId, articleIds);
  }
}
