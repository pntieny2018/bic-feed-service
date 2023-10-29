import { ActorObjectDto } from './user.dto';

export class ReactionObjectDto {
  public id: string;
  public createdAt: Date;
  public commentId?: string;
  public contentId?: string;
  public actor: ActorObjectDto;
  public reactionName: string;
  public reactionsCount?: ReactionsCountObjectDto;

  public constructor(data: ReactionObjectDto) {
    Object.assign(this, data);
  }
}

export class ReactionsCountObjectDto {
  [index: string]: Record<string, number>;
}
