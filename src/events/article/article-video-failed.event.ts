import { ArticleVideoHasBeenFailed } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { VideoProcessingEndDto } from '../../modules/post/dto/responses/process-video-response.dto';

export class ArticleVideoFailedEvent implements IEvent<VideoProcessingEndDto> {
  protected static event = ArticleVideoHasBeenFailed;

  public payload: VideoProcessingEndDto;

  public constructor(payload: VideoProcessingEndDto) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return ArticleVideoFailedEvent.event;
  }
}
