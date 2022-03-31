import { UserSharedDto } from '../../../shared/user/dto';

export class NotificationPayloadDto<T> {
  public actor: UserSharedDto;
  public data: T;
}
