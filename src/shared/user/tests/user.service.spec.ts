import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { RedisService } from '@app/redis';
import { sharedUsersMock } from './mocks/user.mock';

jest.mock('class-transformer');

describe('UserService', () => {
  let service: UserService;
  let redisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: RedisService,
          useValue: {
            mget: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('UserService.get', () => {
    it('param is undefined', async () => {
      const data = await service.get(undefined);
      expect(data).toBeUndefined();
    });
    it('param is null', async () => {
      const data = await service.get(null);
      expect(data).toBeUndefined();
    });

    it('param is 1', async () => {
      redisService.get.mockResolvedValue(sharedUsersMock[0]);
      const data = await service.get(1);
      expect(data).toEqual(sharedUsersMock[0]);
    });
  });

  describe('UserService.getMany', () => {
    it('param is undefined', async () => {
      const data = await service.getMany(undefined);
      expect(redisService.mget).not.toBeCalled();
      expect(data).toEqual([]);
    });
    it('param is null', async () => {
      const data = await service.getMany(null);
      expect(redisService.mget).not.toBeCalled();
      expect(data).toEqual([]);
    });
    it('param is empty array', async () => {
      const data = await service.getMany(null);
      expect(redisService.mget).not.toBeCalled();
      expect(data).toEqual([]);
    });
    it('param is array with no duplicate item', async () => {
      redisService.mget.mockResolvedValue(sharedUsersMock);
      const userIds = [1, 2];
      const data = await service.getMany(userIds);
      expect(redisService.mget).toBeCalled();
      const keys = redisService.mget.mock.calls[0][0];
      expect(keys.length).toBe(userIds.length);
      expect(keys.every((k) => k.indexOf('US:') > -1)).toBe(true);
      expect(data).toEqual(sharedUsersMock);
    });

    it('param is array with duplicate item', async () => {
      redisService.mget.mockResolvedValue(sharedUsersMock);
      const userIds = [1, 2, 1];
      const data = await service.getMany(userIds);
      expect(redisService.mget).toBeCalled();
      const keys = redisService.mget.mock.calls[0][0];
      expect(keys.length).toBeLessThan(userIds.length);
      expect(keys.every((k) => k.indexOf('US:') > -1)).toBe(true);
      expect(data).toEqual(sharedUsersMock);
    });
  });
});
