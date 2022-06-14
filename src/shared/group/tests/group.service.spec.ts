import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from '../group.service';
import { RedisService } from '@app/redis';
import { sharedGroupMock } from './mocks/shared-group.mock';
import { mockedUserAuth } from '../../../modules/post/test/mocks/user.mock';

describe('GroupService', () => {
  let service: GroupService;
  let redisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: RedisService,
          useValue: {
            mget: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);

    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GroupService.get', () => {
    it('param is undefined', async () => {
      const data = await service.get(undefined);
      expect(data).toBeUndefined();
    });
    it('param is null', async () => {
      const data = await service.get(null);
      expect(data).toBeUndefined();
    });

    it('param is 1', async () => {
      redisService.get.mockResolvedValue(sharedGroupMock[0]);
      const data = await service.get(1);
      expect(data).toEqual(sharedGroupMock[0]);
    });
  });

  describe('GroupService.getMany', () => {
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
      redisService.mget.mockResolvedValue(sharedGroupMock);
      const groupIds = [1, 2];
      const data = await service.getMany(groupIds);
      expect(redisService.mget).toBeCalled();
      const keys = redisService.mget.mock.calls[0][0];
      expect(keys.length).toBe(groupIds.length);
      expect(keys.every((k) => k.indexOf('SG:') > -1)).toBe(true);
      expect(data).toEqual(sharedGroupMock);
    });

    it('param is array with duplicate item', async () => {
      redisService.mget.mockResolvedValue(sharedGroupMock);
      const groupIds = [1, 2, 1];
      const data = await service.getMany(groupIds);
      expect(redisService.mget).toBeCalled();
      const keys = redisService.mget.mock.calls[0][0];
      expect(keys.length).toBeLessThan(groupIds.length);
      expect(keys.every((k) => k.indexOf('SG:') > -1)).toBe(true);
      expect(data).toEqual(sharedGroupMock);
    });
  });

  describe('GroupService.isMemberOfSomeGroups', () => {
    it('is member', () => {
      const isMember = service.isMemberOfSomeGroups([1, 2], [2, 3]);
      expect(isMember).toBe(true);
    });
    it('is not member', () => {
      const isMember = service.isMemberOfSomeGroups([1, 5], [2, 3, 4]);
      expect(isMember).toBe(false);
    });
  });

  describe('GroupService.isMemberOfGroups', () => {
    it('is member', () => {
      const isMember = service.isMemberOfGroups([1, 2], [2, 1]);
      expect(isMember).toBe(true);
    });
    it('is not member', () => {
      const isMember = service.isMemberOfGroups([1, 2], [2, 4]);
      expect(isMember).toBe(false);
    });
  });

  describe('GroupService.getGroupIdsCanAccess', () => {
    it('return list access', () => {
      const listAccess = service.getGroupIdsCanAccess(sharedGroupMock[0], mockedUserAuth);
      expect(listAccess).toEqual([1, 2]);
    });
    it('return list access group secret', () => {
      const listAccess = service.getGroupIdsCanAccess(sharedGroupMock[3], mockedUserAuth);
      expect(listAccess).toEqual([]);
    });
  });

  describe('GroupService.getGroupIdsCanAccessArticle', () => {
    it('return list access', () => {
      const listAccess = service.getGroupIdsCanAccessArticle(sharedGroupMock[2], mockedUserAuth);
      expect(listAccess).toEqual([4, 5, 3]);
    });
    it('return list access group secret', () => {
      const listAccess = service.getGroupIdsCanAccessArticle(sharedGroupMock[3], mockedUserAuth);
      expect(listAccess).toEqual([]);
    });
  });
});
