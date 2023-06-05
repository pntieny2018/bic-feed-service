import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { SeriesChangedMessagePayload } from '../../application/dto/message/series-changed.message-payload';
import { ProcessSeriesDeletedCommand } from '../../application/command/process-series-deleted/process-series-deleted.command';

@Controller()
export class PostConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.SERIES_CHANGED)
  public async postChanged(@Payload('value') payload: SeriesChangedMessagePayload): Promise<any> {
    if (payload.state === 'delete') {
      await this._commandBus.execute<ProcessSeriesDeletedCommand, void>(
        new ProcessSeriesDeletedCommand(payload)
      );
    }
  }
}
