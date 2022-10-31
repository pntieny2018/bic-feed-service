import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { PostHasBeenDeletedEvent, PostHasBeenUpdatedEvent } from '../../../events/post';
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { FeedService } from '../../feed/feed.service';
import { CreateSeriesDto, GetSeriesDto, UpdateSeriesDto } from '../dto/requests';
import { SeriesResponseDto } from '../dto/responses';
import { SeriesService } from '../series.service';

@Injectable()
export class SeriesAppService {
  private _logger = new Logger(SeriesAppService.name);
  public constructor(
    private _seriesService: SeriesService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _feedService: FeedService
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
      return this._seriesService.get(created.id, user, new GetSeriesDto());
    }
  }

  public async updateSeries(
    user: UserDto,
    postId: string,
    updateSeriesDto: UpdateSeriesDto
  ): Promise<void> {
    //
  }

  public async deleteSeries(user: UserDto, seriesId: string): Promise<boolean> {
    const postDeleted = await this._seriesService.delete(user, seriesId);
    if (postDeleted) {
      this._eventEmitter.emit(
        new PostHasBeenDeletedEvent({
          post: postDeleted,
          actor: user.profile,
        })
      );
      return true;
    }
    return false;
  }
}
