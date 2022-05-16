import { PostVideoHasBeenFailed } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { ProcessVideoResponseDto } from '../../modules/post/dto/responses/process-video-response.dto';

export class PostVideoFailedEvent implements IEvent<ProcessVideoResponseDto> {
  protected static event = PostVideoHasBeenFailed;

  public payload: ProcessVideoResponseDto;

  public constructor(payload: ProcessVideoResponseDto) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return PostVideoFailedEvent.event;
  }
}
