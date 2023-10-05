import { ActorObjectDto } from './user.dto';

export class ReactionObjectDto {
  public id: string;
  public actor: ActorObjectDto;
  public reactionName: string;
  public createdAt: Date;

  public constructor(data: ReactionObjectDto) {
    Object.assign(this, data);
  }
}

export class ReactionsCountObjectDto {
  [index: string]: Record<string, number>;
}
