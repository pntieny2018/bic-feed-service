import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { PageDto } from '../../../common/dto';
import {
  SeriesHasBeenDeletedEvent,
  SeriesHasBeenPublishedEvent,
  SeriesHasBeenUpdatedEvent,
} from '../../../events/series';
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { FeedService } from '../../feed/feed.service';
import { PostService } from '../../post/post.service';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from '../dto/requests';
import { GetSeriesSavedDto } from '../dto/requests/get-series-saved.dto';
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
    private _postService: PostService
  ) {}

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

  public async savePost(user: UserDto, postId: string): Promise<boolean> {
    await this._seriesService.checkExistAndPublished(postId);
    await this._postService.savePostToUserCollection(postId, user.id);
    return true;
  }

  public async unSavePost(user: UserDto, postId: string): Promise<boolean> {
    await this._seriesService.checkExistAndPublished(postId);
    await this._postService.unSavePostToUserCollection(postId, user.id);
    return true;
  }

  public async getListSavedByUserId(
    user: UserDto,
    search: GetSeriesSavedDto
  ): Promise<PageDto<SeriesResponseDto>> {
    return this._seriesService.getListSavedByUserId(user.id, search);
  }
}
