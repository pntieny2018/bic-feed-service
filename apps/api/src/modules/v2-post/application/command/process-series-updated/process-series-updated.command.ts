import { ICommand } from '@nestjs/cqrs';
import { SeriesChangedMessagePayload } from '../../dto/message';

export class ProcessSeriesUpdatedCommand implements ICommand {
  public constructor(public readonly payload: SeriesChangedMessagePayload) {}
}
