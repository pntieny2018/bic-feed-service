import { SeriesResponseDto } from '../../../modules/series/dto/responses';
import { UserSharedDto } from '../../../shared/user/dto';

export class SeriesHasBeenPublishedEventPayload {
  public series: SeriesResponseDto;
  public actor: UserSharedDto;
}
