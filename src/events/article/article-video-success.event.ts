import { ArticleVideoHasBeenPublished } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import {
  ProcessVideoResponseDto,
  VideoProcessingEndDto,
} from '../../modules/post/dto/responses/process-video-response.dto';

export class ArticleVideoSuccessEvent implements IEvent<VideoProcessingEndDto> {
  protected static event = ArticleVideoHasBeenPublished;

  public payload: VideoProcessingEndDto;

  public constructor(payload: VideoProcessingEndDto) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return ArticleVideoSuccessEvent.event;
  }
}
