import { TargetType, VerbActivity } from '../../data-type';

import {
  CommentActivityObjectDto,
  CommentRecipientDto,
  ReplyCommentRecipientDto,
} from './comment.dto';
import { ActorObjectDto } from './user.dto';

export class NotificationActivityDto<T> {
  public id: string;
  public object: T;
  public verb: VerbActivity;
  public target: TargetType;
  public createdAt: Date;

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

  public constructor(data: NotificationPayloadDto<T>) {
    this.key = data.key;
    this.value = {
      actor: new ActorObjectDto(data.value.actor),
      event: data.value.event,
      data: data.value.data,
      meta: data.value.meta,
    };
  }
}

class NotificationMetaPayloadDto<T> {
  public report?: {
    creatorId?: string;
    content?: string;
    adminInfos?: { [groupId: string]: string[] }; // TODO: remove when noti v3 is ready
  };

  public post?: {
    oldData?: NotificationActivityDto<T>;
    ignoreUserIds?: string[];
  };

  public comment?: {
    commentRecipient?: CommentRecipientDto;
    replyCommentRecipient?: ReplyCommentRecipientDto;
    prevCommentActivities?: NotificationActivityDto<CommentActivityObjectDto>[];
  };

  public series?: {
    isSendToContentCreator?: boolean;
    targetUserIds?: string[];
    contentIsDeleted?: boolean;
    context?: string;
  };
}
