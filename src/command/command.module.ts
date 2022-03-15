import { Module } from '@nestjs/common';
import { SeedCommand } from './seed/seed.command';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configs } from '../config/configuration';
import { RedisModule } from '../../libs/redis/src/redis.module';
import { IRedisConfig } from '../config/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configs],
    }),
    RedisModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get<IRedisConfig>('redis');
        const sslConfig = redisConfig.ssl
          ? {
              tls: {
                host: redisConfig.host,
                port: redisConfig.port,
                password: redisConfig.password,
              },
            }
          : {};
        return {
          redisOptions: {
            db: redisConfig.db,
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            ...sslConfig,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [SeedCommand],
})
export class CommandModule {}
