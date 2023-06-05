import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { SeriesChangedMessagePayload } from '../../application/dto/message/series-changed.message-payload';
import { ProcessSeriesDeletedCommand } from '../../application/command/process-series-deleted/process-series-deleted.command';
import { ProcessSeriesPublishedCommand } from '../../application/command/process-series-published/process-series-published.command';

@Controller()
export class PostConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.SERIES_CHANGED)
  public async postChanged(@Payload('value') payload: SeriesChangedMessagePayload): Promise<any> {
    switch (payload.state) {
      case 'publish':
        await this._commandBus.execute<ProcessSeriesPublishedCommand, void>(
          new ProcessSeriesPublishedCommand(payload)
        );
        break;
      case 'delete':
        await this._commandBus.execute<ProcessSeriesDeletedCommand, void>(
          new ProcessSeriesDeletedCommand(payload)
        );
        break;
      default:
        break;
    }
  }
}
