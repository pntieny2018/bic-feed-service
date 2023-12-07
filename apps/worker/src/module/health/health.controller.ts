import { HealthLabel } from '@libs/common/health-check/health.constants';
import { KafkaHealthIndicator, RedisHealthIndicator } from '@libs/common/health-check/indicators';
import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';
import { Sequelize } from 'sequelize-typescript';

@Controller('health')
export class HealthController {
  public constructor(
    @InjectConnection() private readonly _connection: Sequelize,
    private readonly _healthCheckService: HealthCheckService,
    private readonly _memoryHealthIndicator: MemoryHealthIndicator,
    private readonly _sequelizeHealthIndicator: SequelizeHealthIndicator,
    private readonly _kafkaHealthIndicator: KafkaHealthIndicator,
    private readonly _redisHealthIndicator: RedisHealthIndicator
  ) {}

  @Get('livez')
  public live(): string {
    return 'OK';
  }

  @Get('readyz')
  @HealthCheck()
  public async ready(): Promise<HealthCheckResult> {
    const heapUsedThresholdInMB = process.env.HEALTH_CHECK_HEAP_SIZE
      ? parseInt(process.env.HEALTH_CHECK_HEAP_SIZE)
      : 256;
    return await this._healthCheckService.check([
      async (): Promise<HealthIndicatorResult> =>
        this._memoryHealthIndicator.checkHeap(
          HealthLabel.MEMORY_HEAP_KEY,
          heapUsedThresholdInMB * 1024 * 1024
        ),
      async (): Promise<HealthIndicatorResult> =>
        this._sequelizeHealthIndicator.pingCheck(HealthLabel.DATABASE_KEY, {
          connection: this._connection,
          timeout: 5000,
        }),
      async (): Promise<HealthIndicatorResult> =>
        this._kafkaHealthIndicator.isHealthy(HealthLabel.KAFKA_KEY),
      async (): Promise<HealthIndicatorResult> =>
        this._redisHealthIndicator.isHealthy(HealthLabel.REDIS_KEY),
    ]);
  }
}
