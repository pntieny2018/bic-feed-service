import { UserMentionDto } from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';

import { CommentObjectDto, CommentRecipientDto, ReplyCommentRecipientDto } from './comment.dto';
import { AudienceObjectDto } from './group.dto';
import { MediaObjectDto } from './media.dto';
import { ReactionObjectDto, ReactionsCountObjectDto } from './reaction.dto';
import { ReportObjectDto } from './report.dto';
import { SettingObjectDto } from './setting.sto';
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
    prevCommentActivities?: NotificationActivityDto<ActivityObject>[];
  };

  public series?: {
    isSendToContentCreator?: boolean;
    targetUserIds?: string[];
    contentIsDeleted?: boolean;
    context?: string;
  };
}

export class ActivityObject {
  public id: string;
  public actor: ActorObjectDto;
  public setting?: SettingObjectDto;
  public content?: string;
  public contentType?: string;
  public title?: string;
  public media?: MediaObjectDto;
  public mentions?: UserMentionDto;
  public reactionsOfActor?: ReactionObjectDto[];
  public reactionsCount?: ReactionsCountObjectDto;
  public audience?: AudienceObjectDto;
  public comment?: CommentObjectDto;
  public reaction?: ReactionObjectDto;
  public report?: ReportObjectDto;
  public article?: ActivityObject;
  public cover?: string;
  public summary?: string;
  public item?: any;
  public items?: any;
  public createdAt: Date;
  public updatedAt?: Date;

  public constructor(data: ActivityObject) {
    Object.assign(this, data);
  }
}
