import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { SeriesDeletedMessagePayload } from '../../application/dto/message/series-deleted.message-payload';

@Controller()
export class PostConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.SERIES_DELETED)
  public async seriesDeleted(
    @Payload('value') payload: SeriesDeletedMessagePayload
  ): Promise<any> {}
}
