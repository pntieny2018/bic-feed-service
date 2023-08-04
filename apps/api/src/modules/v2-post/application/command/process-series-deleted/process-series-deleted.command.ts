import { ICommand } from '@nestjs/cqrs';
import { SeriesChangedMessagePayload } from '../../dto/message';

export class ProcessSeriesDeletedCommand implements ICommand {
  public constructor(public readonly payload: SeriesChangedMessagePayload) {}
}
