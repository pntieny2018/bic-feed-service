import { UserDto } from '../../../../v2-user/application';

export class SeriesDeletedMessagePayload {
  public id: string;
  public actor: UserDto;

  public constructor(data: Partial<SeriesDeletedMessagePayload>) {
    Object.assign(this, data);
  }
}
