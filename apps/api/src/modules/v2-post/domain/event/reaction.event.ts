import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import { ReactionHasBeenCreated, ReactionHasBeenRemoved } from '../../../../common/constants';
import { ReactionEntity } from '../model/reaction';

interface ReactionEventPayload {
  reactionEntity: ReactionEntity;
  authUser: UserDto;
}
export class ReactionCreatedEvent implements IEventPayload {
  public static event = ReactionHasBeenCreated;

  public payload: ReactionEventPayload;

  public constructor(data: ReactionEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ReactionCreatedEvent.event;
  }
}

export class ReactionDeletedEvent implements IEventPayload {
  public static event = ReactionHasBeenRemoved;

  public payload: ReactionEventPayload;

  public constructor(data: ReactionEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ReactionDeletedEvent.event;
  }
}
