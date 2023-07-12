import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RedisService } from '@app/redis';
import { SentryService } from '@app/sentry';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_KEYS } from '../../../../common/constants';
import { ProcessArticleScheduledCommand } from '../../application/command/process-article-scheduled/process-article-scheduled.command';

@Injectable()
export class ArticleCron {
  private readonly _logger = new Logger(ArticleCron.name);

  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _redisService: RedisService,
    private readonly _sentryService: SentryService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async hanldeJobScheduledArticle(): Promise<void> {
    const canRunScheduleArticle = await this._redisService.setNxEx(
      CACHE_KEYS.IS_RUNNING_ARTICLE_SCHEDULE,
      true
    );

    if (canRunScheduleArticle === 1) {
      try {
        await this._commandBus.execute<ProcessArticleScheduledCommand, void>(
          new ProcessArticleScheduledCommand({
            beforeDate: new Date(),
          })
        );
      } catch (err) {
        this._logger.error(JSON.stringify(err?.stack));
        this._sentryService.captureException(err);
      }
    }

    await this._redisService.del(CACHE_KEYS.IS_RUNNING_ARTICLE_SCHEDULE);
  }
}
