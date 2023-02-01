import { DomainEvent, UUID } from '@beincom/domain';
import { TagEntity } from '../model/tag/tag.entity';

export class TagDeletedEvent extends DomainEvent<{ name: string }> {
  protected _aggregateId: unknown;
  protected _eventId: string;

  public constructor(data) {
    super(data);
  }
}
