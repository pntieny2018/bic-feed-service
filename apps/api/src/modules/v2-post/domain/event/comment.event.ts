import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import { CommentHasBeenCreated } from '../../../../common/constants';
import { CommentEntity } from '../model/comment';

interface CommentEventPayload {
  user: UserDto;
  comment: CommentEntity;
}

export class CommentCreatedEvent implements IEventPayload {
  public static event = CommentHasBeenCreated;

  public payload: CommentEventPayload;

  public constructor(data: CommentEventPayload) {
    this.payload = data;
  }
}
