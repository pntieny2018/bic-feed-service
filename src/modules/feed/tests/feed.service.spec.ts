import { RedisModule } from '../../../../libs/redis/src';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from 'src/database';
import { PostModel } from 'src/database/models/post.model';
import { UserModule, UserService } from 'src/shared/user';
import { FeedService } from '../feed.service';
import { mockGetTimeLineDto, mockUserDto } from './mocks/input.mock';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IRedisConfig } from 'src/config/redis';
import { configs } from 'src/config/configuration';
import { instanceToPlain, plainToClass, plainToInstance } from 'class-transformer';
import { mockGetTimelineOutput } from './mocks/output.mock';
import { FeedPostDto } from '../dto/response';

describe('FeedService', () => {
  let feedService: FeedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
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
        UserModule,
      ],
      providers: [FeedService],
    }).compile();

    feedService = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(feedService).toBeDefined();
  });

  describe('User get timeline', () => {
    describe('Get timeline success with order important-post-first and created-at second', () => {
      it('Should get successfully with predefined timeline', async () => {
        const result = await feedService.getTimeline(mockUserDto, mockGetTimeLineDto);
        const rawResult = instanceToPlain(result);
        // console.log(result.data[0].createdAt.toString());
        expect(rawResult).toEqual(mockGetTimelineOutput);
      });
    });
  });
});
