import { Test, TestingModule } from '@nestjs/testing';
import { GroupApplicationService, GroupDto, IGroupApplicationService } from '../../application';
import { createMock } from '@golevelup/ts-jest';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../../domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from '../../driven-adapter/repository/group.repository';
import {
  groupDto,
  groupListMock,
  groupMock,
  groupPropsMock,
  userMocked,
} from '../mocks/group.mock';
import { GroupEntity } from '../../domain/model/group';
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
    const groupEntityMocked = new GroupEntity(groupPropsMock);
    it('Should returned a GroupDto', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(groupEntityMocked);
      groupAppService.findOne = jest.fn().mockImplementation(groupAppService.findOne);
      const result = await groupAppService.findOne(groupPropsMock.id);
      expect(groupAppService.findOne).toBeCalledWith(groupPropsMock.id);
      expect(groupAppService.findOne).toBeCalledTimes(1);
      expect(result).toEqual(groupMock.find((group) => group.id === groupPropsMock.id));
    });
  });

  describe('GroupService.findAllByIds', () => {
    const groupEntitiesMocked = groupListMock.map((item) => new GroupEntity(item));
    const groupIds = groupListMock.map((item) => item.id);
    it('Should returned a list of GroupDto', async () => {
      jest.spyOn(repo, 'findAllByIds').mockResolvedValue(groupEntitiesMocked);
      groupAppService.findAllByIds = jest.fn().mockImplementation(groupAppService.findAllByIds);
      const result = await groupAppService.findAllByIds(groupIds);
      expect(groupAppService.findAllByIds).toBeCalledWith(groupIds);
      expect(groupAppService.findAllByIds).toBeCalledTimes(1);
      expect(result).toEqual(groupMock.filter((group) => groupIds.includes(group.id)));
    });
  });

  describe('GroupService.getGroupIdAndChildIdsUserJoined', () => {
    it('Should returned be true', () => {
      groupAppService.getGroupIdAndChildIdsUserJoined = jest
        .fn()
        .mockImplementation(groupAppService.getGroupIdAndChildIdsUserJoined);
      const result = groupAppService.getGroupIdAndChildIdsUserJoined(groupDto, userMocked.groups);
      expect(groupAppService.getGroupIdAndChildIdsUserJoined).toBeCalledWith(
        groupDto,
        userMocked.groups
      );
      expect(groupAppService.getGroupIdAndChildIdsUserJoined).toBeCalledTimes(1);
      expect(result).toEqual([
        'e2487d02-b7be-4185-8245-f7596eba1437',
        '9b42ac09-e9b9-4899-9a72-3a0832693ea4',
        'c4d5c2be-86f5-4db2-8959-af92ff5ae469',
      ]);
    });
  });

  describe('GroupService.getGroupIdAndChildIdsUserJoined.OPEN', () => {
    const cloesedGroupMocked: GroupDto = { ...groupDto, privacy: GroupPrivacy.OPEN };
    it('Should returned be true', () => {
      groupAppService.getGroupIdAndChildIdsUserJoined = jest
        .fn()
        .mockImplementation(groupAppService.getGroupIdAndChildIdsUserJoined);
      const result = groupAppService.getGroupIdAndChildIdsUserJoined(
        cloesedGroupMocked,
        userMocked.groups
      );
      expect(groupAppService.getGroupIdAndChildIdsUserJoined).toBeCalledWith(
        cloesedGroupMocked,
        userMocked.groups
      );
      expect(result).toEqual([
        'e2487d02-b7be-4185-8245-f7596eba1437',
        '9b42ac09-e9b9-4899-9a72-3a0832693ea4',
        'c4d5c2be-86f5-4db2-8959-af92ff5ae469',
      ]);
    });
  });

  describe('GroupService.getGroupAdminIds', () => {
    it('Should returned list adminIds', async () => {
      jest.spyOn(repo, 'getGroupAdminIds').mockResolvedValue([userMocked.id]);
      groupAppService.getGroupAdminIds = jest
        .fn()
        .mockImplementation(groupAppService.getGroupAdminIds);
      const result = await groupAppService.getGroupAdminIds(userMocked, userMocked.groups);
      expect(groupAppService.getGroupAdminIds).toBeCalledWith(userMocked, userMocked.groups);
      expect(result).toEqual([userMocked.id]);
    });
  });

  describe('GroupService.getAdminIds', () => {
    const groupAdminsResponse = {
      code: 'api.ok',
      meta: {
        message: 'Success',
        total: 2,
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
    };
    it('Should returned list adminIds', async () => {
      jest.spyOn(repo, 'getAdminIds').mockResolvedValue(groupAdminsResponse.data);
      groupAppService.getAdminIds = jest.fn().mockImplementation(groupAppService.getAdminIds);
      const result = await groupAppService.getAdminIds(groupMock.map((item) => item.id));
      expect(groupAppService.getAdminIds).toBeCalledWith(groupMock.map((item) => item.id));
      expect(result).toEqual(groupAdminsResponse.data);
    });
  });
});
