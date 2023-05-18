import { Controller, Get } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';

@Controller('a')
export class PostPublishedConsumer {
  public constructor() {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_PUBLISHED)
  public async postPublished(@Payload('value') payload: any): Promise<any> {
    console.log('postPublished', payload);
  }
}
