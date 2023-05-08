import { SeriesResponseDto } from '../../../modules/series/dto/responses';
import { UserDto } from '../../../modules/v2-user/application';

export class SeriesHasBeenUpdatedEventPayload {
  public oldSeries: SeriesResponseDto;
  public newSeries: SeriesResponseDto;
  public actor: UserDto;
}
