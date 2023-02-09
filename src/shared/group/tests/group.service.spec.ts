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
      const data = await service.get('b0d0287a-3ec9-4b9b-8032-2c491d954945');
      expect(data).toEqual(sharedGroupMock[0]);
    });
  });

  describe('GroupService.getMany', () => {
    it('param is empty array', async () => {
      const data = await service.getMany([]);
      expect(redisService.mget).not.toBeCalled();
      expect(data).toEqual([]);
    });
    it('param is array with no duplicate item', async () => {
      redisService.mget.mockResolvedValue(sharedGroupMock);
      const groupIds = ['b0d0287a-3ec9-4b9b-8032-2c491d954945', '85dfe22e-866d-49a5-bbef-3fbc72e4febf'];
      const data = await service.getMany(groupIds);
      expect(redisService.mget).toBeCalled();
      const keys = redisService.mget.mock.calls[0][0];
      expect(keys.length).toBe(groupIds.length);
      expect(keys.every((k) => k.indexOf('SG:') > -1)).toBe(true);
      expect(data).toEqual(sharedGroupMock);
    });

    it('param is array with duplicate item', async () => {
      redisService.mget.mockResolvedValue(sharedGroupMock);
      const groupIds = ['b0d0287a-3ec9-4b9b-8032-2c491d954945', '85dfe22e-866d-49a5-bbef-3fbc72e4febf', 'b0d0287a-3ec9-4b9b-8032-2c491d954945'];
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
      const isMember = service.isMemberOfSomeGroups(['b0d0287a-3ec9-4b9b-8032-2c491d954945', '85dfe22e-866d-49a5-bbef-3fbc72e4febf'], ['85dfe22e-866d-49a5-bbef-3fbc72e4febf', '3a1a2058-1ce3-4f63-bb78-162e5a87d55']);
      expect(isMember).toBe(true);
    });
    it('is not member', () => {
      const isMember = service.isMemberOfSomeGroups(['b0d0287a-3ec9-4b9b-8032-2c491d954945', '47551266-1827-414a-a75a-8b0d46b0a164'], ['85dfe22e-866d-49a5-bbef-3fbc72e4febf', '3a1a2058-1ce3-4f63-bb78-162e5a87d55', '2a47c42d-f41d-457d-8359-707f4d0ab242']);
      expect(isMember).toBe(false);
    });
  });

  describe.skip('GroupService.getGroupIdAndChildIdsUserJoined', () => {
    it('return list access', () => {
      const listAccess = service.getGroupIdAndChildIdsUserJoined(sharedGroupMock[0], mockedUserAuth);
      expect(listAccess).toEqual(
        []
      );
    });
    it('return list access group secret', () => {
      const listAccess = service.getGroupIdAndChildIdsUserJoined(sharedGroupMock[3], mockedUserAuth);
      expect(listAccess).toEqual([]);
    });
  });

  describe('GroupService.getGroupIdsCanAccessArticle', () => {
    it('return list access', () => {
      const listAccess = service.getGroupIdAndChildIdsUserJoined(sharedGroupMock[2], mockedUserAuth);
      expect(listAccess).toEqual(
        []
      );
    });
    it('return list access group secret', () => {
      const listAccess = service.getGroupIdAndChildIdsUserJoined(sharedGroupMock[3], mockedUserAuth);
      expect(listAccess).toEqual([]);
    });
  });
});
