import { Injectable } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { PageDto } from '../../../common/dto';
import {
  SeriesAddedItemsEvent,
  SeriesReoderItemsEvent,
  SeriesRemovedItemsEvent,
} from '../../../events/series';
import { SeriesSearchResponseDto } from '../dto/responses/series-search.response.dto';
import { AuthorityService } from '../../authority';
import { PostService } from '../../post/post.service';
import { SearchService } from '../../search/search.service';
import { SearchSeriesDto } from '../dto/requests/search-series.dto';
import { SeriesService } from '../series.service';
import { UserDto } from '../../v2-user/application';
import { RULES } from '../../v2-post/constant';
import {
  ArticleLimitAttachedSeriesException,
  ContentEmptyGroupException,
  SeriesNotFoundException,
  ValidationException,
} from '../../v2-post/domain/exception';
import { DomainForbiddenException } from '../../../common/exceptions';

@Injectable()
export class SeriesAppService {
  public constructor(
    private _seriesService: SeriesService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _postSearchService: SearchService,
    private _postService: PostService
  ) {}

  public async searchSeries(
    user: UserDto,
    searchDto: SearchSeriesDto
  ): Promise<PageDto<SeriesSearchResponseDto>> {
    return this._postSearchService.searchSeries(user, searchDto);
  }

  public async removeItems(seriesId: string, itemIds: string[], user: UserDto): Promise<void> {
    const series = await this._postService.getListWithGroupsByIds([seriesId], false);
    if (series.length === 0) {
      throw new SeriesNotFoundException();
    }
    await this._authorityService.checkPostOwner(series[0], user.id);
    await this._authorityService.checkCanUpdateSeries(
      user,
      series[0].groups.map((group) => group.groupId)
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
      throw new SeriesNotFoundException();
    }

    if (series[0].groups.length === 0) {
      throw new ContentEmptyGroupException();
    }

    await this._authorityService.checkPostOwner(series[0], user.id);

    const seriesGroupIds = series[0].groups.map((group) => group.groupId);
    const posts = await this._postService.getListWithGroupsByIds(itemIds, false);

    if (posts.length < itemIds.length) {
      throw new ValidationException('Items parameter is invalid');
    }

    const seriesIdsList = posts.map((post) => post.postSeries);
    const isOverLimtedToAttachSeries = !seriesIdsList.every(
      (seriesIds) => seriesIds.length < RULES.LIMIT_ATTACHED_SERIES
    );

    if (isOverLimtedToAttachSeries) {
      throw new ArticleLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }

    await this._authorityService.checkCanUpdateSeries(
      user,
      series[0].groups.map((group) => group.groupId)
    );

    const invalidItems = [];

    for (const post of posts) {
      if (post.groups.length === 0) {
        throw new ContentEmptyGroupException();
      }

      const isValid = post.groups.some((group) => seriesGroupIds.includes(group.groupId));
      if (!isValid) {
        invalidItems.push(post);
      }
    }
    if (invalidItems.length) {
      throw new DomainForbiddenException(
        `You can not add item: ${invalidItems.map((e) => e.title).join(', ')}`,
        null,
        { seriesDenied: invalidItems.map((e) => e.id) }
      );
    }

    await this._seriesService.addItems(series[0], itemIds);
    this._eventEmitter.emit(
      new SeriesAddedItemsEvent({
        actor: user,
        seriesId,
        itemIds,
        context: 'add',
      })
    );
  }

  public async reorderItems(seriesId: string, itemIds: string[], user: UserDto): Promise<void> {
    const series = await this._seriesService.findSeriesById(seriesId, {
      withGroups: true,
    });
    if (!series) throw new SeriesNotFoundException();
    await this._authorityService.checkPostOwner(series, user.id);
    await this._authorityService.checkCanUpdateSeries(
      user,
      series.groups.map((group) => group.groupId)
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
