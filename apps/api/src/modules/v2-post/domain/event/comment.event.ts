import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import {
  CommentHasBeenCreated,
  CommentHasBeenDeleted,
  CommentHasBeenUpdated,
} from '../../../../common/constants';
import { CommentEntity } from '../model/comment';

interface CommentEventPayload {
  actor: UserDto;
  comment: CommentEntity;
  oldComment?: CommentEntity;
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

export class CommentUpdatedEvent implements IEventPayload {
  public static event = CommentHasBeenUpdated;

  public payload: CommentEventPayload;

  public constructor(data: CommentEventPayload) {
    this.payload = data;
  }
}
