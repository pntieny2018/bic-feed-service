import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../../../common/constants';
import {
  ProcessArticleDeletedCommand,
  ProcessArticlePublishedCommand,
  ProcessArticleUpdatedCommand,
} from '../../application/command/article';
import { ArticleChangedMessagePayload } from '../../application/dto/message';

@Controller()
export class ArticleConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED)
  public async articleChanged(
    @Payload('value') payload: ArticleChangedMessagePayload
  ): Promise<any> {
    switch (payload.state) {
      case 'publish':
        await this._commandBus.execute<ProcessArticlePublishedCommand, void>(
          new ProcessArticlePublishedCommand(payload)
        );
        break;
      case 'update':
        await this._commandBus.execute<ProcessArticleUpdatedCommand, void>(
          new ProcessArticleUpdatedCommand(payload)
        );
        break;
      case 'delete':
        await this._commandBus.execute<ProcessArticleDeletedCommand, void>(
          new ProcessArticleDeletedCommand(payload)
        );
        break;
      default:
        break;
    }
  }
}
