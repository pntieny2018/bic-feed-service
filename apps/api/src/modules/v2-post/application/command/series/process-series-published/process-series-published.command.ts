import { ICommand } from '@nestjs/cqrs';

import { SeriesChangedMessagePayload } from '../../../dto/message';

export class ProcessSeriesPublishedCommand implements ICommand {
  public constructor(public readonly payload: SeriesChangedMessagePayload) {}
}
