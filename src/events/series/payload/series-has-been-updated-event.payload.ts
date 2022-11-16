import { SeriesResponseDto } from '../../../modules/series/dto/responses';
import { UserSharedDto } from '../../../shared/user/dto';

export class SeriesHasBeenUpdatedEventPayload {
  public oldSeries: SeriesResponseDto;
  public newSeries: SeriesResponseDto;
  public actor: UserSharedDto;
}
