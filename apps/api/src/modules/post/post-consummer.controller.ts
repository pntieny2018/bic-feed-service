import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { KAFKA_TOPIC } from '../../common/constants';
import { PostVideoFailedEvent } from '../../events/post/post-video-failed.event';
import { PostVideoSuccessEvent } from '../../events/post/post-video-success.event';

import { VideoProcessingEndDto } from './dto/responses/process-video-response.dto';

import { VideoProcessStatus } from '.';

@Controller()
export class PostConsumerController {
  private _logger = new Logger(PostConsumerController.name);
  public constructor(private _eventEmitter: InternalEventEmitterService) {}

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
}
