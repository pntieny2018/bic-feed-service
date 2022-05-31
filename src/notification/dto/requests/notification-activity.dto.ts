import { v4 } from 'uuid';
import { TypeActivity, VerbActivity } from '../../notification.constants';

export class ActivityObject {
  public id: string;
  public actor: ActorObject;
  public setting?: SettingObject;
  public content?: string;
  public media?: MediaObject;
  public mentions?: MentionObject;
  public reactionsOfActor?: ReactionObject[];
  public reactionsCount?: ReactionsCountObject;
  public audience: AudienceObject[];
  public comment?: CommentObject;
  public reaction?: ReactionObject;
  public createdAt: Date;
  public updatedAt: Date;
}

export class SettingObject {
  public canReact: boolean;
  public canComment: boolean;
  public canShare: boolean;
  public isImportant: boolean;
  public importantExpiredAt?: Date;
}
export class ActorObject {
  public id: number;
  public username: string;
  public avatar: string;
  public fullname: string;
  public email?: string;
}

export class MentionObject {
  [index: string]: ActorObject[];
}
export class MediaObject {
  public images: any[];
  public videos: any[];
  public files: any[];
}

export class ReactionsCountObject {
  [index: string]: Record<any, unknown>;
}

export class AudienceObject {
  public id: number;
  public name: string;
  public icon: string;
}

export class ReactionObject {
  public id: string;
  public actor?: ActorObject;
  public reactionName: string;
  public createdAt: Date;
}

export class CommentObject {
  public id: string;
  public actor: ActorObject;
  public content?: string;
  public media?: MediaObject;
  public mentions?: MentionObject;
  public reaction?: ReactionObject;
  public giphyId?: string;
  public giphyUrl?: string;
  public reactionsOfActor?: ReactionObject[];
  public reactionsCount?: ReactionsCountObject;
  public child?: CommentObject;
  public createdAt: Date;
  public updatedAt: Date;
}

export class NotificationActivity {
  public id: string;
  public object: ActivityObject;
  public verb: VerbActivity | string;
  public target: TypeActivity;
  public ignore?: number[];
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(
    object: ActivityObject,
    verb: VerbActivity | string,
    target: TypeActivity,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = v4();
    this.object = object;
    this.verb = verb;
    this.target = target;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
