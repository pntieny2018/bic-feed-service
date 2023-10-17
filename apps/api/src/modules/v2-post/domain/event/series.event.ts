import { UserDto } from '@libs/service/user';

import { SeriesEntity } from '../model/content';

export class SeriesCreatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity, public readonly actor: UserDto) {}
}

export class SeriesUpdatedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity) {}
}

export class SeriesDeletedEvent {
  public constructor(public readonly seriesEntity: SeriesEntity, public readonly actor: UserDto) {}
}
