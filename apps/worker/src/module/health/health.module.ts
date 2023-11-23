import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { KafkaHealthIndicator, RedisHealthIndicator } from '@libs/common/health-check/indicators';

@Module({
  imports: [TerminusModule, PostgresModule],
  controllers: [HealthController],
  providers: [KafkaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
