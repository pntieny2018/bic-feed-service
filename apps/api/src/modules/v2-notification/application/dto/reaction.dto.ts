import { CONTENT_TARGET } from '@beincom/constants';

import { ActorObjectDto } from './user.dto';

export class ReactionObjectDto {
  public id: string;
  public actor?: ActorObjectDto;
  public target?: CONTENT_TARGET;
  public targetId?: string;
  public reactionName: string;
  public createdAt?: Date;

  public constructor(data: ReactionObjectDto) {
    this.id = data.id;
    data.actor && (this.actor = new ActorObjectDto(data.actor));
    this.reactionName = data.reactionName;
    this.createdAt = data.createdAt;
  }
}

export class ReactionsCountObjectDto {
  [index: string]: number;
}
