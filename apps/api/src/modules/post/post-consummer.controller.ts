import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { KAFKA_TOPIC } from '../../common/constants';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';
import { PostsArchivedOrRestoredByGroupEvent } from '../../events/post/posts-archived-or-restored-by-group.event';

import { StateVerb, UpdateStateDto } from './dto/requests/update-state.dto';
import { VideoProcessingEndDto } from './dto/responses/process-video-response.dto';
import { PostService } from './post.service';

import { VideoProcessStatus } from '.';

@Controller()
export class PostConsumerController {
  private _logger = new Logger(PostConsumerController.name);
  public constructor(
    private _postService: PostService,
    private _eventEmitter: InternalEventEmitterService
  ) {}

  @EventPattern(KAFKA_TOPIC.BEIN_UPLOAD.VIDEO_HAS_BEEN_PROCESSED)
  public async createVideoPostDone(
    @Payload('value') videoProcessingEndDto: VideoProcessingEndDto
  ): Promise<void> {
    this._logger.debug(`[Event video processed]: ${JSON.stringify(videoProcessingEndDto)}`);
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
