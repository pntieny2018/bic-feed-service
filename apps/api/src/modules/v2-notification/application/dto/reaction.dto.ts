import { ActorObjectDto } from './user.dto';

export class ReactionObjectDto {
  public id: string;
  public actor: ActorObjectDto;
  public reactionName: string;
  public createdAt: Date;

  public constructor(data: ReactionObjectDto) {
    this.id = data.id;
    this.actor = new ActorObjectDto(data.actor);
    this.reactionName = data.reactionName;
    this.createdAt = data.createdAt;
  }
}

export class ReactionsCountObjectDto {
  [index: string]: Record<string, number>;
}
