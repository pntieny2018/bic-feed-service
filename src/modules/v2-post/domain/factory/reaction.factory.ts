import { ReactionEntity, ReactionProps } from '../model/reaction';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

export class ReactionFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public reconstitute(properties: ReactionProps): ReactionEntity {
    return new ReactionEntity(properties);
  }
}
