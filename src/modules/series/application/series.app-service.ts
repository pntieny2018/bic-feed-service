import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenUpdatedEvent,
} from '../../../events/post';
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { FeedService } from '../../feed/feed.service';
import {
  CreateSeriesDto,
  GetSeriesDto,
  GetSeriesDto,
  UpdateSeriesDto,
} from '../dto/requests';
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

  public async getSeries(
    user: UserDto,
    postId: string,
    getSeriesDto: GetSeriesDto
  ): Promise<SeriesResponseDto> {
    //getSeriesDto.hideSecretAudienceCanNotAccess = true;
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
  ): Promise<SeriesResponseDto> {
    const { audience } = updateSeriesDto;
    const postBefore = await this._seriesService.get(postId, user, new GetSeriesDto());
    if (postBefore.isDraft === false && audience.groupIds.length === 0) {
      throw new BadRequestException('Audience is required');
    }
    await this._authorityService.checkCanUpdatePost(user, postBefore, audience.groupIds);

    const oldGroupIds = postBefore.audience.groups.map((group) => group.id);
    const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
    if (newAudienceIds.length) {
      const isImportant = setting?.isImportant ?? postBefore.setting.isImportant;
      await this._authorityService.checkCanCreatePost(user, newAudienceIds, isImportant);
    }
    if (postBefore.isDraft === false) {
      this._seriesService.checkContent(updateSeriesDto.content, updateSeriesDto.media);
      const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
      if (removeGroupIds.length) {
        await this._authorityService.checkCanDeletePost(user, removeGroupIds, postBefore.createdBy);
      }
    }

    const isUpdated = await this._seriesService.update(postBefore, user, updateSeriesDto);
    if (isUpdated) {
      const postUpdated = await this._seriesService.get(postId, user, new GetSeriesDto());
      this._eventEmitter.emit(
        new PostHasBeenUpdatedEvent({
          oldPost: postBefore,
          newPost: postUpdated,
          actor: user.profile,
        })
      );

      return postUpdated;
    }
  }

  public async deleteSeries(user: UserDto, postId: string): Promise<boolean> {
    const postDeleted = await this._seriesService.delete(postId, user);
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
