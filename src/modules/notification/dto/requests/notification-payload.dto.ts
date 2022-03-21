export class NotificationPayloadDto<T> {
  public lang: string;
  public event: string;
  public payload: T;
}
