import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { IGroupRepository } from '../../../domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from '../../../driven-adapter/repository/group.repository';
import { RedisService } from '@app/redis';
import * as rxjs from 'rxjs';
import { GroupEntity, GroupProps } from '../../../domain/model/group';

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
  });

  describe('GroupRepository.findAllByIds', () => {
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
      jest.spyOn(store, 'mget').mockResolvedValue([]);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue(response);
      const result = await repo.findAllByIds(response.data.data.map((item) => item.id));
      expect(result).toEqual(response.data.data.map((item) => new GroupEntity(item as GroupProps)));
    });
  });

  describe('GroupRepository.getGroupAdminIds', () => {
    const userMocked = {
      id: '7251dac7-5088-4a33-b900-d1b058edaf98',
      username: 'martine.baumbach',
      avatar: 'https://bein.group/baumbach.png',
      email: 'baumbach@tgm.vn',
      fullname: 'Martine Baumbach',
      groups: [
        'c4d5c2be-86f5-4db2-8959-af92ff5ae469',
        '9b42ac09-e9b9-4899-9a72-3a0832693ea4',
        'bc04d99e-97e5-42ef-9006-1448a5d05f85',
        'e2487d02-b7be-4185-8245-f7596eba1437',
      ],
    };

    const response = {
      data: {
        code: 'OK',
        data: {
          groupAdmin: {
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
          groupMember: {
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

    it('Should returned a list groupIds', async () => {
      jest.spyOn(repo, 'getGroupAdminIds').mockResolvedValue([userMocked.id]);
      const result = repo.getGroupAdminIds(userMocked, userMocked.groups);
      expect(result).resolves.toEqual([userMocked.id]);
    });
  });
});
