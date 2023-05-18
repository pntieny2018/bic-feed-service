import { SeriesResponseDto } from '../../../modules/series/dto/responses';
import { UserDto } from '../../../modules/v2-user/application';

export class SeriesHasBeenPublishedEventPayload {
  public series: SeriesResponseDto;
  public actor: UserDto;
}
