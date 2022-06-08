import { ArticleVideoHasBeenFailed } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { ProcessVideoResponseDto } from '../../modules/post/dto/responses/process-video-response.dto';

export class ArticleVideoFailedEvent implements IEvent<ProcessVideoResponseDto> {
  protected static event = ArticleVideoHasBeenFailed;

  public payload: ProcessVideoResponseDto;

  public constructor(payload: ProcessVideoResponseDto) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return ArticleVideoFailedEvent.event;
  }
}
