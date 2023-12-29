import { KafkaHealthIndicator, RedisHealthIndicator } from '@libs/common/health-check/indicators';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, PostgresModule],
  controllers: [HealthController],
  providers: [KafkaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
