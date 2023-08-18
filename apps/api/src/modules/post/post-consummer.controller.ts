import { Controller, Logger } from '@nestjs/common';
import { PostService } from './post.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../common/constants';
import { UpdatePrivacyDto } from './dto/requests/update-privacy.dto';
import { PostPrivacy } from '../../database/models/post.model';
import { VideoProcessStatus } from '.';
import { VideoProcessingEndDto } from './dto/responses/process-video-response.dto';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { StateVerb, UpdateStateDto } from './dto/requests/update-state.dto';
import { PostsArchivedOrRestoredByGroupEvent } from '../../events/post/posts-archived-or-restored-by-group.event';

@Controller()
export class PostConsumerController {
  private _logger = new Logger(PostConsumerController.name);
  public constructor(
    private _postService: PostService,
    private _eventEmitter: InternalEventEmitterService
  ) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async privacyUpdate(@Payload('value') updatePrivacyDto: UpdatePrivacyDto): Promise<void> {
    const postIds = await this._postService.findIdsByGroupId([updatePrivacyDto.groupId], null);
    const postIdsNeedToUpdatePrivacy = await this._postService.filterPostIdsNeedToUpdatePrivacy(
      postIds,
      updatePrivacyDto.privacy
    );
    for (const [privacy, postIds] of Object.entries(postIdsNeedToUpdatePrivacy)) {
      await this._postService.updateData(postIds, { privacy: PostPrivacy[privacy] });
    }
  }

  @EventPattern(KAFKA_TOPIC.BEIN_UPLOAD.VIDEO_HAS_BEEN_PROCESSED)
  public async createVideoPostDone(
    @Payload('value') videoProcessingEndDto: VideoProcessingEndDto
  ): Promise<void> {
    switch (videoProcessingEndDto.status) {
      case VideoProcessStatus.DONE:
        this._eventEmitter.emit(new PostVideoSuccessEvent(videoProcessingEndDto));
        break;
      case VideoProcessStatus.ERROR:
        this._eventEmitter.emit(new PostVideoFailedEvent(videoProcessingEndDto));
        break;
    }
  }

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.GROUP_STATE_HAS_BEEN_CHANGED)
  public async updateState(@Payload('value') updateStateDto: UpdateStateDto): Promise<void> {
    this._logger.debug(`[Event group change state]: ${JSON.stringify(updateStateDto)}`);
    const groupIds: string[] = updateStateDto.data.object.groups.map((e) => e.id);
    const postIdsAffected = await this._postService.updateGroupStateAndGetPostIdsAffected(
      groupIds,
      updateStateDto.data.verb === StateVerb.archive
    );
    if (postIdsAffected) {
      const payload = await this._postService.getPostsArchivedOrRestoredByGroupEventPayload(
        postIdsAffected
      );
      this._eventEmitter.emit(new PostsArchivedOrRestoredByGroupEvent(payload));
    }
  }
}
