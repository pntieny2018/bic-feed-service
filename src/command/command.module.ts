import { Module } from '@nestjs/common';
import { SeedCommand } from './seed/seed.command';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configs } from '../config/configuration';
import { RedisModule } from '../../libs/redis/src/redis.module';
import { IRedisConfig } from '../config/redis';
import { DatabaseModule } from '../database';
import { SequelizeTinkerCommand } from './sequelize-tinker.command';
import { CommentModule } from '../modules/comment';
import { FeedModule } from '../modules/feed';
import { PostModule } from '../modules/post';
import { UploadModule } from '../modules/upload';
import { MediaModule } from '../modules/media/media.module';
import { UserModule } from '../shared/user';
import { GroupModule } from '../shared/group';
import { MentionModule } from '../modules/mention';

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
    // DatabaseModule,
    // CommentModule,
    // PostModule,
    // MediaModule,
    // UserModule,
    // GroupModule,
    // MentionModule,
  ],
  providers: [SeedCommand], //, SequelizeTinkerCommand],
})
export class CommandModule {}
