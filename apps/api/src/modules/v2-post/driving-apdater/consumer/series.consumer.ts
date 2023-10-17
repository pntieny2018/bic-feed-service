import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../../../common/constants';
import {
  ProcessSeriesPublishedCommand,
  ProcessSeriesUpdatedCommand,
} from '../../application/command/series';
import { SeriesChangedMessagePayload } from '../../application/dto/message';

@Controller()
export class SeriesConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.SERIES_CHANGED)
  public async postChanged(@Payload('value') payload: SeriesChangedMessagePayload): Promise<any> {
    switch (payload.state) {
      case 'publish':
        await this._commandBus.execute<ProcessSeriesPublishedCommand, void>(
          new ProcessSeriesPublishedCommand(payload)
        );
        break;
      case 'update':
        await this._commandBus.execute<ProcessSeriesUpdatedCommand, void>(
          new ProcessSeriesUpdatedCommand(payload)
        );
        break;
      default:
        break;
    }
  }
}
