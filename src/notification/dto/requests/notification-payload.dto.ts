import { UserSharedDto } from '../../../shared/user/dto';

export class NotificationPayloadDto<T> {
  public actor: UserSharedDto;
  public event: string;
  public data: T;
}
