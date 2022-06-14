import { PostVideoHasBeenFailed } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import {
  ProcessVideoResponseDto,
  VideoProcessingEndDto,
} from '../../modules/post/dto/responses/process-video-response.dto';

export class PostVideoFailedEvent implements IEvent<VideoProcessingEndDto> {
  protected static event = PostVideoHasBeenFailed;

  public payload: VideoProcessingEndDto;

  public constructor(payload: VideoProcessingEndDto) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return PostVideoFailedEvent.event;
  }
}
