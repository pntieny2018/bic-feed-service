import { UserSharedDto } from '../../../shared/user/dto';

export class NotificationPayloadDto<T> {
  public key: string;
  public value: {
    actor: UserSharedDto;
    event: string;
    data: T;
  };
}
