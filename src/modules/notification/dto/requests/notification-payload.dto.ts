export class NotificationPayloadDto<T> {
  public lang: string;
  public event: string;
  public payload: T;
}

export interface INotification {
  actor: number;
  to: number[];
  data: {
    description: string;
    entity: string;
    parentEntity?: string;
    postId?: number;
    reactionId?: number;
    commentId?: number;
  };
}
