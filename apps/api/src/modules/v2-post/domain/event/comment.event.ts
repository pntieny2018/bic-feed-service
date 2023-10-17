import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import { CommentHasBeenCreated, CommentHasBeenDeleted } from '../../../../common/constants';
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

export class CommentDeletedEvent implements IEventPayload {
  public static event = CommentHasBeenDeleted;

  public payload: CommentEventPayload;

  public constructor(data: CommentEventPayload) {
    this.payload = data;
  }
}
