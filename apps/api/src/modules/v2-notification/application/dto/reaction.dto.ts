import { CONTENT_TARGET } from '@beincom/constants';

import { CommentObjectDto } from './comment.dto';
import { ContentActivityObjectDto } from './content.dto';
import { ActorObjectDto } from './user.dto';

export class ReactionObjectDto {
  public id: string;
  public actor?: ActorObjectDto;
  public target?: CONTENT_TARGET;
  public targetId?: string;
  public reactionName: string;
  public createdAt?: Date;

  public constructor(data: ReactionObjectDto) {
    Object.assign(this, data);
  }
}

export class ReactionsCountObjectDto {
  [index: string]: number;
}

export class ReactionCommentActivityObjectDto extends ContentActivityObjectDto {
  public comment: CommentObjectDto;

  public constructor(data: ReactionCommentActivityObjectDto) {
    super(data);
  }
}

export class ReactionContentActivityObjectDto extends ContentActivityObjectDto {
  public constructor(data: ReactionContentActivityObjectDto) {
    super(data);
  }
}
