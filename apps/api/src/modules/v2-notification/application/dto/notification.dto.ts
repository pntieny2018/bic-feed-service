import { TargetType, VerbActivity } from '../../data-type';

import { CommentRecipientDto, ReplyCommentRecipientDto } from './comment.dto';
import { ActorObjectDto } from './user.dto';

export class NotificationActivityDto<T> {
  public id: string;
  public object: T;
  public verb: VerbActivity;
  public target: TargetType;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: NotificationActivityDto<T>) {
    Object.assign(this, data);
  }
}

export class NotificationPayloadDto<T> {
  public key: string;
  public value: {
    actor: ActorObjectDto;
    event: string;
    data: NotificationActivityDto<T>;
    meta?: NotificationMetaPayloadDto<T>;
  };
}

class NotificationMetaPayloadDto<T> {
  public report?: {
    adminInfos?: {
      [rootGroupId: string]: string[];
    };
    creatorId?: string;
  };

  public post?: {
    oldData?: NotificationActivityDto<T>;
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
    context?: string;
  };
}