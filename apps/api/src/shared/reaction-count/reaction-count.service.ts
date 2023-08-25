import { RedisService } from '@libs/infra/redis';
import { SentryService } from '@libs/infra/sentry';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReactionCountService {
  public static REACTION_COUNT = 'reaction_count';

  private _logger = new Logger(ReactionCountService.name);

  public constructor(
    private _store: RedisService,
    private readonly _sentryService: SentryService
  ) {}

  public async getTotalKind(targetType: string, entityId: number): Promise<number> {
    try {
      const total = await this._store.get<string>(
        `${ReactionCountService.REACTION_COUNT}:${targetType}:${entityId}`
      );
      if (!total) {
        return 0;
      }
      return parseInt(total);
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
      return null;
    }
  }
  public async increment(targetType: string, entityId: number): Promise<void> {
    try {
      const total = await this.getTotalKind(targetType, entityId);
      await this._store.set(
        `${ReactionCountService.REACTION_COUNT}:${targetType}:${entityId}`,
        total + 1
      );
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
    }
  }

  public async decrement(targetType: string, entityId: number): Promise<void> {
    try {
      const total = await this.getTotalKind(targetType, entityId);
      const updatedTotal = total - 1 <= 0 ? 0 : total - 1;

      await this._store.set(
        `${ReactionCountService.REACTION_COUNT}:${targetType}:${entityId}`,
        updatedTotal
      );
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
    }
  }
}
