import { RedisService } from '@libs/infra/redis';
import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  public constructor(private readonly _redisService: RedisService) {
    super();
  }
  public async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pingResponse = await this._redisService.getClient().ping();

      return this.getStatus(key, pingResponse === 'PONG', null);
    } catch (ex) {
      throw new HealthCheckError(
        ex.message,
        this.getStatus(key, false, {
          message: ex.message,
        })
      );
    }
  }
}
