import { CONTENT_TYPE } from '@beincom/constants';

import { ActorObjectDto } from './user.dto';

export class ReactionObjectDto {
  public id: string;
  public commentId?: string;
  public parentId?: string;
  public contentId: string;
  public contentType: CONTENT_TYPE;
  public createdAt: Date;
  public actor: ActorObjectDto;
  public reactionName: string;

  public constructor(data: ReactionObjectDto) {
    Object.assign(this, data, { actor: new ActorObjectDto(data.actor) });
  }
}
