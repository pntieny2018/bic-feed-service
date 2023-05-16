import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';
import { DEFAULT_APP_VERSION, KAFKA_TOPIC } from '../../../../common/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClassTransformer } from 'class-transformer';
import { EventPattern, Payload } from '@nestjs/microservices';

@ApiTags('Notification')
@ApiSecurity('authorization')
@Controller({
  version: DEFAULT_APP_VERSION,
  path: 'notification',
})
export class NotificationConsumer {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  private _classTransformer = new ClassTransformer();

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_PUBLISHED)
  public async postPublished(@Payload('value') dto: any): Promise<void> {}
}
