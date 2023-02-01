import { DomainEvent } from '@beincom/domain';
import { TagEntity } from '../model/tag/tag.entity';

export class TagCreatedEvent extends DomainEvent<TagEntity> {
  protected _aggregateId: unknown;
  protected _eventId: string;

  public constructor(data) {
    super(data);
  }
}
