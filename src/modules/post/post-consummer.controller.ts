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

@Controller()
export class PostConsumerController {
  private _logger = new Logger(PostConsumerController.name);
  public constructor(
    private _postService: PostService,
    private _eventEmitter: InternalEventEmitterService
  ) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async privacyUpdate(@Payload('value') updatePrivacyDto: UpdatePrivacyDto): Promise<void> {
    this._logger.debug(`[privacyUpdate]: ${JSON.stringify(updatePrivacyDto)}`);
    const postIds = await this._postService.findPostIdsByGroupId([updatePrivacyDto.groupId], null);
    const postIdsNeedToUpdatePrivacy = await this._postService.filterPostIdsNeedToUpdatePrivacy(
      postIds,
      updatePrivacyDto.privacy
    );
    for (const [privacy, postIds] of Object.entries(postIdsNeedToUpdatePrivacy)) {
      await this._postService.bulkUpdatePostPrivacy(postIds, PostPrivacy[privacy]);
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
}
