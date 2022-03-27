import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FeedGeneratorService {
  private readonly _logger = new Logger(FeedGeneratorService.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  public generatorOfflineNewFeeds(): void {
    this._logger.debug('Called every 5 minute');
  }
}
