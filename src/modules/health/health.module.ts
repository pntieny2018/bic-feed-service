import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseModule } from '../../database';
import { TerminusModule } from '@nestjs/terminus';
import { KafkaHealthIndicator, RedisHealthIndicator } from './indicators';

@Module({
  imports: [TerminusModule, DatabaseModule],
  controllers: [HealthController],
  providers: [KafkaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
