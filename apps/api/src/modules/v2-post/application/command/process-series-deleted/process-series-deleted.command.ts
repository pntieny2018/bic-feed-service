import { ICommand } from '@nestjs/cqrs';
import { SeriesChangedMessagePayload } from '../../dto/message/series-changed.message-payload';

export class ProcessSeriesDeletedCommand implements ICommand {
  public constructor(public readonly payload: SeriesChangedMessagePayload) {}
}
