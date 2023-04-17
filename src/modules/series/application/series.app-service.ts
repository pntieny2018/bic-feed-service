import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PageDto } from '../../../common/dto';
import { ExceptionHelper } from '../../../common/helpers';
import {
  SeriesAddedItemsEvent,
  SeriesHasBeenDeletedEvent,
  SeriesHasBeenPublishedEvent,
  SeriesHasBeenUpdatedEvent,
  SeriesReoderItemsEvent,
} from '../../../events/series';
import { SeriesRemovedItemsEvent } from '../../../events/series/series-removed-items.event';
import { SeriesSearchResponseDto } from '../dto/responses/series-search.response.dto';
import { AuthorityService } from '../../authority';
import { FeedService } from '../../feed/feed.service';
import { PostService } from '../../post/post.service';
import { SearchService } from '../../search/search.service';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from '../dto/requests';
import { SearchSeriesDto } from '../dto/requests/search-series.dto';
import { SeriesResponseDto } from '../dto/responses';
import { SeriesService } from '../series.service';
import { IPost, PostStatus } from '../../../database/models/post.model';
import { UserDto } from '../../v2-user/application';
import { LogicException } from '../../../common/exceptions';
import { IPostGroup } from '../../../database/models/post-group.model';

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
    const seriesResponseDto = await this._seriesService.get(postId, user, getSeriesDto);

    if (
      (seriesResponseDto.isHidden || seriesResponseDto.status !== PostStatus.PUBLISHED) &&
      seriesResponseDto.createdBy !== user?.id
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }

    const series = {
      privacy: seriesResponseDto.privacy,
      createdBy: seriesResponseDto.createdBy,
      status: seriesResponseDto.status,
      type: seriesResponseDto.type,
      groups: seriesResponseDto.audience.groups.map(
        (g) =>
          ({
            groupId: g.id,
          } as IPostGroup)
      ),
    } as IPost;

    if (user) {
      await this._authorityService.checkCanReadSeries(
        user,
        series,
        seriesResponseDto.audience.groups
      );
    } else {
      await this._authorityService.checkIsPublicSeries(series);
    }

    if (user) {
      this._postService.markSeenPost(postId, user.id).catch((ex) => {
        this._logger.error(JSON.stringify(ex?.stack));
      });
    }

    return seriesResponseDto;
  }

  public async createSeries(user: UserDto, createSeriesDto: CreateSeriesDto): Promise<any> {
    const { audience, setting } = createSeriesDto;
    if (audience.groupIds?.length > 0) {
      const isEnableSetting =
        setting.isImportant ||
        setting.canComment === false ||
        setting.canReact === false ||
        setting.canShare === false;
      await this._authorityService.checkCanCreateSeries(user, audience.groupIds, isEnableSetting);
    }
    const created = await this._seriesService.create(user, createSeriesDto);
    if (created) {
      const series = await this._seriesService.get(created.id, user, new GetSeriesDto());
      this._postService.markSeenPost(series.id, user.id);
      series.totalUsersSeen = Math.max(series.totalUsersSeen, 1);
      this._eventEmitter.emit(
        new SeriesHasBeenPublishedEvent({
          series,
          actor: user,
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
    const { audience, setting } = updateSeriesDto;
    const seriesBefore = await this._seriesService.get(postId, user, new GetSeriesDto());

    if (!seriesBefore) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    await this._authorityService.checkPostOwner(seriesBefore, user.id);

    if (audience.groupIds.length === 0) {
      throw new BadRequestException('Audience is required');
    }
    let isEnableSetting = false;
    if (
      setting &&
      (setting.isImportant ||
        setting.canComment === false ||
        setting.canReact === false ||
        setting.canShare === false)
    ) {
      isEnableSetting = true;
    }

    const oldGroupIds = seriesBefore.audience.groups.map((group) => group.id);
    await this._authorityService.checkCanUpdateSeries(user, oldGroupIds, false);
    this._authorityService.checkUserInSomeGroups(user, oldGroupIds);
    const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
    if (newAudienceIds.length) {
      await this._authorityService.checkCanCreateSeries(user, newAudienceIds, isEnableSetting);
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
          actor: user,
        })
      );

      return seriesUpdated;
    }
  }

  public async deleteSeries(user: UserDto, seriesId: string): Promise<boolean> {
    const series = await this._seriesService.findSeriesById(seriesId, {
      withItemId: true,
      withGroups: true,
    });
    if (!series) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }
    await this._authorityService.checkPostOwner(series, user.id);

    if (series.status === PostStatus.PUBLISHED) {
      await this._authorityService.checkCanDeleteSeries(
        user,
        series.groups.map((g) => g.groupId)
      );
    }

    const seriesDeleted = await this._seriesService.delete(user, series);
    if (seriesDeleted) {
      this._eventEmitter.emit(
        new SeriesHasBeenDeletedEvent({
          series: seriesDeleted,
          actor: user,
        })
      );
      return true;
    }
    return false;
  }

  public async removeItems(seriesId: string, itemIds: string[], user: UserDto): Promise<void> {
    const series = await this._postService.getListWithGroupsByIds([seriesId], false);
    if (series.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }
    await this._authorityService.checkPostOwner(series[0], user.id);
    await this._authorityService.checkCanUpdateSeries(
      user,
      series[0].groups.map((group) => group.groupId),
      false
    );
    await this._seriesService.removeItems(series[0], itemIds);
    const items = await this._postService.getListWithGroupsByIds(itemIds, false);
    this._eventEmitter.emit(
      new SeriesRemovedItemsEvent({
        seriesId,
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          type: item.type,
          createdBy: item.createdBy,
          groupIds: item.groups.map((group) => group.groupId),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        actor: user,
        contentIsDeleted: false,
      })
    );
  }

  public async addItems(seriesId: string, itemIds: string[], user: UserDto): Promise<void> {
    const series = await this._postService.getListWithGroupsByIds([seriesId], false);

    if (series.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    }

    if (series[0].groups.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_GROUP_REQUIRED);
    }

    await this._authorityService.checkPostOwner(series[0], user.id);

    const seriesGroupIds = series[0].groups.map((group) => group.groupId);
    const posts = await this._postService.getListWithGroupsByIds(itemIds, false);

    if (posts.length < itemIds.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_VALIDATION_ERROR,
        message: `Items parameter is invalid`,
      });
    }

    await this._authorityService.checkCanUpdateSeries(
      user,
      series[0].groups.map((group) => group.groupId),
      false
    );

    const invalidItems = [];

    for (const post of posts) {
      if (post.groups.length === 0) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_GROUP_REQUIRED);
      }

      const isValid = post.groups.some((group) => seriesGroupIds.includes(group.groupId));
      if (!isValid) {
        invalidItems.push(post);
      }
    }
    if (invalidItems.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You can not add item: ${invalidItems.map((e) => e.title).join(', ')}`,
        errors: { seriesDenied: invalidItems.map((e) => e.id) },
      });
    }

    await this._seriesService.addItems(series[0], itemIds);
    this._eventEmitter.emit(
      new SeriesAddedItemsEvent({
        actor: user,
        seriesId,
        itemIds,
      })
    );
  }

  public async reorderItems(seriesId: string, itemIds: string[], user: UserDto): Promise<void> {
    const series = await this._seriesService.findSeriesById(seriesId, {
      withGroups: true,
    });
    if (!series) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING);
    await this._authorityService.checkPostOwner(series, user.id);
    await this._authorityService.checkCanUpdateSeries(
      user,
      series.groups.map((group) => group.groupId),
      false
    );
    await this._seriesService.reorderItems(seriesId, itemIds);
    this._eventEmitter.emit(
      new SeriesReoderItemsEvent({
        seriesId,
        itemIds,
      })
    );
  }
}
