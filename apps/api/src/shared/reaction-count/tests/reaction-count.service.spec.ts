import { RedisService } from '@libs/infra/redis';
import { SentryService } from '@libs/infra/sentry';
import { Test, TestingModule } from '@nestjs/testing';

import { ReactionCountService } from '../reaction-count.service';

describe('ReactionCountService', () => {
  let service: ReactionCountService;
  let redisService;
  let sentryService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionCountService,
        {
          provide: RedisService,
          useValue: {
            mget: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReactionCountService>(ReactionCountService);

    redisService = module.get<RedisService>(RedisService);
    sentryService = module.get<SentryService>(SentryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ReactionCountService.getTotalKind', () => {
    it('getTotalKind 0', async () => {
      const data = await service.getTotalKind('1', 1);
      expect(data).toEqual(0);
      expect(redisService.get).toBeCalled();
    });

    it('should fail', async () => {
      redisService.get.mockRejectedValue(new Error('1'));
      const data = await service.getTotalKind('1', 1);
      expect(sentryService.captureException).toBeCalled();
    });
  });

  describe('ReactionCountService.increment', () => {
    it('redis call', async () => {
      await service.increment('1', 1);
      expect(redisService.set).toBeCalled();
      expect(redisService.get).toBeCalled();
    });

    it('should fail', async () => {
      redisService.set.mockRejectedValue(new Error('2'));
      const data = await service.increment('1', 1);
      expect(sentryService.captureException).toBeCalled();
    });
  });

  describe('ReactionCountService.decrement', () => {
    it('redis call', () => {
      service.decrement('1', 1);
      expect(redisService.get).toBeCalled();
    });

    it('should fail', async () => {
      redisService.set.mockRejectedValue(new Error('3'));
      const data = await service.decrement('1', 1);
      expect(sentryService.captureException).toBeCalled();
    });
  });
});
