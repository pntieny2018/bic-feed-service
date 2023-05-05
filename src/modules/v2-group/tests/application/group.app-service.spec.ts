import { Test, TestingModule } from '@nestjs/testing';
import { GroupApplicationService, GroupDto, IGroupApplicationService } from '../../application';
import { createMock } from '@golevelup/ts-jest';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../../domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from '../../driven-adapter/repository/group.repository';
import { groupMock } from '../mocks/group.mock';
import { GroupEntity, GroupProps } from '../../domain/model/group';
import { GroupPrivacy } from '../../data-type';

describe('GroupApplicationService', () => {
  let groupAppService: IGroupApplicationService;
  let repo: IGroupRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupApplicationService,
        {
          provide: GROUP_REPOSITORY_TOKEN,
          useValue: createMock<GroupRepository>(),
        },
      ],
    }).compile();
    groupAppService = module.get<GroupApplicationService>(GroupApplicationService);
    repo = module.get(GROUP_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GroupService.findOne', () => {
    const groupPropsMock: GroupProps = {
      id: '22ccce09-0cea-4984-be0f-44e8839ac52b',
      name: 'Love TS',
      icon: 'ts',
      privacy: GroupPrivacy.OPEN,
      rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
      communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
      isCommunity: false,
      child: {
        open: ['d3a2e019-1dba-485d-a8cf-ec037e9f25af', 'd3bc1d0d-0511-43e7-acfa-197a7aeab7eb'],
        closed: [],
        private: [],
        secret: [],
      },
    };
    const groupEntityMocked = new GroupEntity(groupPropsMock);
    it('Should returned a GroupDto', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(groupEntityMocked);
      const result = await groupAppService.findOne(groupPropsMock.id);
      expect(result).toEqual(groupMock.find((group) => group.id === groupPropsMock.id));
    });
  });

  describe('GroupService.findAllByIds', () => {
    const groupPropsMock: GroupProps[] = [
      {
        id: '22ccce09-0cea-4984-be0f-44e8839ac52b',
        name: 'Love TS',
        icon: 'ts',
        privacy: GroupPrivacy.OPEN,
        rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
        communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
        isCommunity: false,
        child: {
          open: ['d3a2e019-1dba-485d-a8cf-ec037e9f25af', 'd3bc1d0d-0511-43e7-acfa-197a7aeab7eb'],
          closed: [],
          private: [],
          secret: [],
        },
      },
      {
        id: 'cc5df28b-885b-45a5-b44d-389b0f827c8a',
        name: 'Love Golang',
        icon: 'gl',
        privacy: GroupPrivacy.CLOSED,
        rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
        communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
        isCommunity: false,
        child: {
          open: ['aac7a9ee-1432-4420-86d0-64a663e61123', '3e4822ee-063f-4029-86ca-2e98fae3c708'],
          closed: [],
          private: [],
          secret: [],
        },
      },
    ];
    const groupEntitiesMocked = groupPropsMock.map((item) => new GroupEntity(item));
    const groupIds = groupPropsMock.map((item) => item.id);
    it('Should returned a list of GroupDto', async () => {
      jest.spyOn(repo, 'findAllByIds').mockResolvedValue(groupEntitiesMocked);
      const result = await groupAppService.findAllByIds(groupIds);
      expect(result).toEqual(groupMock.filter((group) => groupIds.includes(group.id)));
    });
  });

  describe('GroupService.getGroupIdAndChildIdsUserJoined', () => {
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
    const groupMocked: GroupDto = {
      child: {
        closed: ['c4d5c2be-86f5-4db2-8959-af92ff5ae469', '4878cd75-16c0-40cc-84e4-ebc42bda2d99'],
        open: ['234de9dd-d84c-421b-bd52-90d982753427', '9b42ac09-e9b9-4899-9a72-3a0832693ea4'],
        secret: [],
        private: ['1d3251ef-f520-4703-b1e9-df29db4d6a9f', 'df98b0f0-c2b7-41dd-a4ee-28fea1e83231'],
      },
      id: 'e2487d02-b7be-4185-8245-f7596eba1437',
      name: '321 matrix',
      icon: 'https://media.beincom.io/image/variants/group/avatar/839b0cb1-a0de-4045-90df-c4ecae39326b',
      privacy: GroupPrivacy.CLOSED,
      rootGroupId: 'e2487d02-b7be-4185-8245-f7596eba1437',
      communityId: '3c5e58f2-ee1d-4292-bf9a-c60cfa3cefe1',
      isCommunity: true,
    };

    it('Should returned be true', () => {
      const result = groupAppService.getGroupIdAndChildIdsUserJoined(
        groupMocked,
        userMocked.groups
      );
      expect(result).toEqual([
        'e2487d02-b7be-4185-8245-f7596eba1437',
        '9b42ac09-e9b9-4899-9a72-3a0832693ea4',
        'c4d5c2be-86f5-4db2-8959-af92ff5ae469',
      ]);
    });
  });
});
