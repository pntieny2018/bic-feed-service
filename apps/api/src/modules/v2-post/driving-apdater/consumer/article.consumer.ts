import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { ProcessArticleUpdatedCommand } from '../../application/command/article';
import { ArticleChangedMessagePayload } from '../../application/dto/message';

@Controller()
export class ArticleConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED)
  public async articleChanged(
    @Payload('value') payload: ArticleChangedMessagePayload
  ): Promise<any> {
    switch (payload.state) {
      case 'update':
        await this._commandBus.execute<ProcessArticleUpdatedCommand, void>(
          new ProcessArticleUpdatedCommand(payload)
        );
        break;

      default:
        break;
    }
  }
}
