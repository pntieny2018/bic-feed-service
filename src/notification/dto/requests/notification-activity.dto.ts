import { v4 } from 'uuid';
import { TypeActivity, VerbActivity } from '../../notification.constants';

export class ActivityObject {
  public id: number;
  public actor: ActorObject;
  public content?: string;
  public media?: MediaObject;
  public mentions?: MentionObject;
  public reactionsCount?: ReactionsCountObject;
  public audience: AudienceObject[];
  public comment?: CommentObject;
  public reaction?: ReactionObject;
  public createdAt: Date;
  public updatedAt: Date;
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
  public id: number;
  public actor: ActorObject;
  public reactionName: string;
  public createdAt: Date;
}

export class CommentObject {
  public id: number;
  public actor: ActorObject;
  public content?: string;
  public media?: MediaObject;
  public mentions?: MentionObject;
  public reaction?: ReactionObject;
  public reactionsCount?: ReactionsCountObject;
  public child?: CommentObject;
  public createdAt: Date;
  public updatedAt: Date;
}

export class NotificationActivity {
  public id: string;
  public object: ActivityObject;
  public verb: VerbActivity | string;
  public type: TypeActivity;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(
    object: ActivityObject,
    verb: VerbActivity | string,
    type: TypeActivity,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = v4();
    this.object = object;
    this.verb = verb;
    this.type = type;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
