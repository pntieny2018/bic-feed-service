import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PageDto } from '../../../common/dto';
import { ExceptionHelper } from '../../../common/helpers';
import {
  SeriesHasBeenDeletedEvent,
  SeriesHasBeenPublishedEvent,
  SeriesHasBeenUpdatedEvent,
} from '../../../events/series';
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { FeedService } from '../../feed/feed.service';
import { PostSearchService } from '../../post/post-search.service';
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
    private _postSearchService: PostSearchService
  ) {}

  public async searchSeries(
    user: UserDto,
    searchDto: SearchSeriesDto
  ): Promise<PageDto<SeriesResponseDto>> {
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
      await this._authorityService.checkCanCreatePost(user, audience.groupIds, false);
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
    await this._authorityService.checkCanUpdateSeries(user, seriesBefore, audience.groupIds);

    const oldGroupIds = seriesBefore.audience.groups.map((group) => group.id);
    const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
    if (newAudienceIds.length) {
      await this._authorityService.checkCanCreatePost(user, newAudienceIds, false);
    }
    const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
    if (removeGroupIds.length) {
      await this._authorityService.checkCanDeletePost(user, removeGroupIds, seriesBefore.createdBy);
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
    const seriesDeleted = await this._seriesService.delete(user, seriesId);
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

  public async removeArticles(id, articleIds: string[], user: UserDto): Promise<boolean> {
    const seriesDeleted = await this._seriesService.delete(user, seriesId);
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

    const groupIds = series.groups.map((group) => group.groupId);
    await this._authorityService.checkCanUpdateSeries(user, series, groupIds);
    return this._seriesService.reorderArticles(seriesId, articleIds);
  }
}
