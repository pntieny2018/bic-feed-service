import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { ArticleChangedMessagePayload } from '../../application/dto/message';
import { ProcessArticleDeletedCommand } from '../../application/command/process-article-deleted/process-article-deleted.command';

@Controller()
export class ArticleConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED)
  public async articleChanged(
    @Payload('value') payload: ArticleChangedMessagePayload
  ): Promise<any> {
    switch (payload.state) {
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
