import { CommentRecipientDto, ReplyCommentRecipientDto } from '../response';

export class NotificationMetaPayloadDto<T> {
  public report?: {
    adminInfos?: {
      [rootGroupId: string]: string[];
    };
    creatorId?: string;
  };

  public context?: string;

  public post?: {
    oldData?: T;
    ignoreUserIds?: string[];
  };
  public comment?: {
    commentRecipient?: CommentRecipientDto;
    replyCommentRecipient?: ReplyCommentRecipientDto;
    prevCommentActivities?: T[];
  };
  public series?: {
    isSendToContentCreator?: boolean;
    targetUserIds?: string[];
    contentIsDeleted?: boolean;
  };
}
export class NotificationPayloadDto<T> {
  public key: string;
  public value: {
    actor: { id: string };
    event: string;
    data: T;
    meta?: NotificationMetaPayloadDto<T>;
  };
}
