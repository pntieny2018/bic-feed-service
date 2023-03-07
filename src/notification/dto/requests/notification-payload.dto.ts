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
    isSendToArticleCreator?: boolean;
    targetUserIds?: string[];
  };
}
export class NotificationPayloadDto<T> {
  public key: string;
  public value: {
    actor: UserDto;
    event: string;
    data: T;
    meta?: NotificationMetaPayloadDto<T>;
  };
}
