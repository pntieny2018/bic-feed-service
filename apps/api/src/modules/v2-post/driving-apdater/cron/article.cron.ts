import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ArticleCron {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  public async jobScheduledArticle(): Promise<void> {
    return;
  }
}
