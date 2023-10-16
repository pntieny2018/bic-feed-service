import { createMock } from '@golevelup/ts-jest';
import { RedisService } from '@libs/infra/redis';
import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as rxjs from 'rxjs';

import { GroupEntity, GroupProps } from '../../../domain/model/group';
import { IGroupRepository } from '../../../domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from '../../../driven-adapter/repository/group.repository';
import { userMocked } from '../../mocks/group.mock';

describe('GroupRepository', () => {
  let repo: IGroupRepository;
  let store: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupRepository,
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
        {
          provide: RedisService,
          useValue: createMock<RedisService>(),
        },
      ],
    }).compile();
    repo = module.get<IGroupRepository>(GroupRepository);
    store = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GroupRepository.findOne', () => {
    const response = {
      data: {
        code: 'OK',
        data: [
          {
            child: { closed: [], open: [], secret: [], private: [] },
            id: 'c87c7ad5-8331-4003-873a-baccd545d88f',
            name: 'Bein Group BE',
            icon: '',
            privacy: 'OPEN',
            rootGroupId: '35b5fb8f-6f7a-4ac2-90bb-18199096c429',
            communityId: '15337361-1577-4b7b-a31d-990df06aa446',
          },
        ],
        meta: {
          total: 0,
          has_next_page: true,
          message: 'string',
          errors: 'string',
        },
      },
      status: 200,
    };

    it('Should returned a GroupEntity', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(null);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue(response);
      const result = await repo.findOne(response.data.data[0].id);
      expect(result).toEqual(new GroupEntity(response.data.data[0] as GroupProps));
    });

    it('Should returned null', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(null);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({});
      const result = await repo.findOne(response.data.data[0].id);
      expect(result).toEqual(null);
    });
  });

  describe('GroupRepository.findAllByIds', () => {
    const response = {
      data: {
        code: 'OK',
        data: [
          {
            id: 'aac7a9ee-1432-4420-86d0-64a663e61123',
            name: 'Bein Group BE',
            icon: '',
            privacy: 'OPEN',
            rootGroupId: '35b5fb8f-6f7a-4ac2-90bb-18199096c429',
            communityId: '15337361-1577-4b7b-a31d-990df06aa446',
            child: { closed: [], open: [], secret: [], private: [] },
          },
          {
            id: 'c87c7ad5-8331-4003-873a-baccd545d88f',
            name: 'Love Golang',
            icon: '',
            privacy: 'CLOSED',
            rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
            communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
            child: {
              open: [
                'aac7a9ee-1432-4420-86d0-64a663e61123',
                '3e4822ee-063f-4029-86ca-2e98fae3c708',
              ],
              closed: [],
              private: [],
              secret: [],
            },
          },
        ],
        meta: {
          total: 10,
          has_next_page: true,
          message: '',
          errors: '',
        },
      },
      status: 200,
    };

    it('Should returned a list GroupEntity', async () => {
      jest.spyOn(store, 'mget').mockResolvedValue([response.data.data[0]]);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({
        ...response,
        data: { ...response.data, data: [response.data.data[1]] },
      });
      const result = await repo.findAllByIds(response.data.data.map((item) => item.id));
      expect(result).toEqual(response.data.data.map((item) => new GroupEntity(item as GroupProps)));
    });
  });

  describe('GroupRepository.getGroupAdminIds', () => {
    const successResponse = {
      data: {
        code: 'OK',
        data: {
          group_admin: {
            name: 'string',
            userCount: 1,
            data: [
              {
                id: 'c87c7ad5-8331-4003-873a-baccd545d88f',
                isAdmin: true,
                roles: {
                  name: 'string',
                },
              },
            ],
          },
          group_member: {
            name: 'string',
            userCount: 1,
            data: [
              {
                id: 'fe26b6bc-0253-49b2-9eb4-3c1545650548',
                isAdmin: false,
                roles: {
                  name: 'string',
                },
              },
            ],
          },
        },
        meta: {
          total: 0,
          has_next_page: true,
          message: 'string',
          errors: 'string',
        },
      },
      status: 200,
    };

    const failedResponse = {
      data: {
        code: 'not.oK',
        data: {},
        meta: {
          total: 0,
          has_next_page: false,
          message: 'Something went wrong',
          errors: 'Unknown error',
        },
      },
      status: 500,
    };

    it('Should returned a list groupIds', async () => {
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValueOnce(successResponse);
      repo.getGroupAdminIds = jest.fn().mockImplementation(repo.getGroupAdminIds);
      const result = await repo.getGroupAdminIds(userMocked, userMocked.groups);
      expect(repo.getGroupAdminIds).toBeCalledWith(userMocked, userMocked.groups);
      expect(result).toEqual(successResponse.data.data.group_admin.data.map((item) => item.id));
    });

    it('Should returned a empty list', async () => {
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValueOnce(failedResponse);
      repo.getGroupAdminIds = jest.fn().mockImplementation(repo.getGroupAdminIds);
      const result = await repo.getGroupAdminIds(userMocked, userMocked.groups);
      expect(repo.getGroupAdminIds).toBeCalledWith(userMocked, userMocked.groups);
      expect(result).toEqual([]);
    });
  });

  describe('GroupRepository.getAdminIds', () => {
    const rootGroupIds = ['c567c88e-38a4-4859-b067-cf91002c5963/'];
    const successResponse = {
      data: {
        code: 'api.ok',
        meta: {
          message: 'Success',
          total: 1,
          offset: 0,
          limit: 20,
          has_next_page: true,
        },
        data: {
          admins: {
            data: ['fe26b6bc-0253-49b2-9eb4-3c1545650548'],
          },
          owners: {},
        },
      },
      status: 200,
    };

    it('Should returned a list adminIds', async () => {
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue(successResponse);
      repo.getAdminIds = jest.fn().mockImplementation(repo.getAdminIds);
      const result = await repo.getAdminIds(rootGroupIds);
      expect(repo.getAdminIds).toBeCalledWith(rootGroupIds);
      expect(result).toEqual(successResponse.data.data);
    });

    const rejectResponse = {
      admins: {},
      owners: {},
    };
    it('Should returned a reject', async () => {
      const error = new NotFoundException('Group id not found');
      jest.spyOn(rxjs, 'lastValueFrom').mockRejectedValue(error);
      repo.getAdminIds = jest.fn().mockImplementation(repo.getAdminIds);
      const result = await repo.getAdminIds(rootGroupIds);
      expect(repo.getAdminIds).toBeCalledWith(rootGroupIds);
      expect(result).toEqual(rejectResponse);
    });

    const groupAdminsResponse = {
      data: {
        code: 'api.not.ok',
        meta: {
          message: 'Something went wrong',
        },
        data: {
          admins: {},
          owners: {},
        },
      },
      status: 500,
    };

    it('Should returned a empty object', async () => {
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue(groupAdminsResponse);
      repo.getAdminIds = jest.fn().mockImplementation(repo.getAdminIds);
      const result = await repo.getAdminIds(rootGroupIds);
      expect(repo.getAdminIds).toBeCalledWith(rootGroupIds);
      expect(result).toEqual(groupAdminsResponse.data.data);
    });
  });
});
