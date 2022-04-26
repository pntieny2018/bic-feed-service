import { Module } from '@nestjs/common';
import { RedisModule } from '@app/redis';
import { UserModule } from '../shared/user';
import { PostModule } from '../modules/post';
import { DatabaseModule } from '../database';
import { GroupModule } from '../shared/group';
import { MediaModule } from '../modules/media';
import { IRedisConfig } from '../config/redis';
import { SeedCommand } from './seed/seed.command';
import { configs } from '../config/configuration';
import { MentionModule } from '../modules/mention';
import { CommentModule } from '../modules/comment';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeTinkerCommand } from './sequelize-tinker.command';
import { InternalEventEmitterModule } from '../app/custom/event-emitter';
import { FeedPublisherModule } from '../modules/feed-publisher';

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
    InternalEventEmitterModule,
    DatabaseModule,
    FeedPublisherModule,
    // CommentModule,
    // PostModule,
    // MediaModule,
    // UserModule,
    // GroupModule,
    // MentionModule,
  ],
  providers: [SequelizeTinkerCommand],
})
export class CommandModule {}
