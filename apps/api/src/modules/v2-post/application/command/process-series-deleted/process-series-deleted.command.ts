import { ICommand } from '@nestjs/cqrs';
import { SeriesDeletedMessagePayload } from '../../dto/message/series-deleted.message-payload';

export class ProcessSeriesDeletedCommand implements ICommand {
  public constructor(public readonly payload: SeriesDeletedMessagePayload) {}
}
