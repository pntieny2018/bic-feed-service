import { CommentRecipientDto, ReplyCommentRecipientDto } from '../response';
import { UserDto } from '../../../modules/v2-user/application';

export class NotificationMetaPayloadDto<T> {
  public report?: {
    adminInfos?: {
      [rootGroupId: string]: string[];
    };
    creatorId?: string;
  };

  public post?: {
    oldData?: T;
  };
  public comment?: {
    commentRecipient?: CommentRecipientDto;
    replyCommentRecipient?: ReplyCommentRecipientDto;
    prevCommentActivities?: T[];
  };
  public series?: {
    isSendToContentCreator?: boolean;
    targetUserIds?: string[];
  };
  public contentIsDeleted?: boolean;
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
