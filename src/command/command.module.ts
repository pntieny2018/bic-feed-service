import { Module } from '@nestjs/common';
import { RedisModule } from '@app/redis';
import { IRedisConfig } from '../config/redis';
import { configs } from '../config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeTinkerCommand } from './sequelize-tinker.command';
import { InternalEventEmitterModule } from '../app/custom/event-emitter';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { FixCommentCountCommand } from './fix-comment-count.command';
import { FixPostCommentCountCommand } from './fix-post-comment-count.command';

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
    FeedPublisherModule,
    // CommentModule,
    // PostModule,
    // MediaModule,
    // UserModule,
    // GroupModule,
    // MentionModule,
  ],
  providers: [SequelizeTinkerCommand, FixCommentCountCommand, FixPostCommentCountCommand],
})
export class CommandModule {}
