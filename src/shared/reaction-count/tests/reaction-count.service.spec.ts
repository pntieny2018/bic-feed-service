import { Test, TestingModule } from '@nestjs/testing';
import { ReactionCountService } from '../reaction-count.service';
import { RedisService } from '@app/redis';
import { mockedUserAuth } from '../../../modules/post/test/mocks/user.mock';
import { SentryService } from '@app/sentry';

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
      const data = await service.getTotalKind('1', 1);
      redisService.get.mockRejectedValue()
      expect(sentryService.captureException).toBeCalled()
    })
  });

  describe('ReactionCountService.increment', () => {
    it('redis call', async () => {
      await service.increment('1', 1);
      expect(redisService.set).toBeCalled();
      expect(redisService.get).toBeCalled();
    });

    it('should fail', async () => {
      const data = await service.increment('1', 1);
      redisService.set.mockRejectedValue()
      expect(sentryService.captureException).toBeCalled()
    })
  });

  describe('ReactionCountService.decrement', () => {
    it('redis call', () => {
      service.decrement('1', 1);
      expect(redisService.get).toBeCalled();
    });

    it('should fail', async () => {
      const data = await service.decrement('1', 1);
      redisService.set.mockRejectedValue()
      expect(sentryService.captureException).toBeCalled()
    })
  });
});
