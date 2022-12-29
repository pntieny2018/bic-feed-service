import { UserSharedDto } from '../../../shared/user/dto';
import { CommentRecipientDto, ReplyCommentRecipientDto } from '../response';

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
    actor: UserSharedDto;
    event: string;
    data: T;
    meta?: NotificationMetaPayloadDto<T>;
  };
}
