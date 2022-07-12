import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from '../../../third-parties/redis/redis-cache.service';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { Ability, subject } from '@casl/ability';
import { CACHE_KEYS, TTL_CACHE } from '../../../common/constants';
import { InternalServerErrorException } from '@nestjs/common';
import {
  CommunityMemberModel,
  CommunityModel,
  GroupMemberModel,
  GroupModel,
  RoleModel,
} from '../../../database/models';
import { getModelToken } from '@nestjs/sequelize';
import { SentryService } from '../../../third-parties/sentry/sentry.service';
import { mockClass } from '../../../common/utilities/test.utility';
import { NO_SUBJECT_ACTIONS } from '../actions';
import { BeinStaffRole } from '../../../database/models/user.model';
import {
  PERMISSION_SCOPE,
  ROLE_TYPE,
} from '../../../modules/roles/role.constant';
import community from 'src/listeners/community';
import { Op } from 'sequelize';

const redisCacheService = mockClass<RedisCacheService>();
const communityModel = mockClass<typeof CommunityModel>();
const communityMemberModel = mockClass<typeof CommunityMemberModel>();
const groupModel = mockClass<typeof GroupModel>();
const groupMemberModel = mockClass<typeof GroupMemberModel>();
const roleModel = mockClass<typeof RoleModel>();
const sentryServiceMock = {
  captureException: jest.fn(),
};
let caslAbilityFactory: CaslAbilityFactory;

describe('casl-ability.factory', () => {
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        { provide: RedisCacheService, useValue: redisCacheService },
        {
          provide: getModelToken(CommunityModel),
          useValue: communityModel,
        },
        {
          provide: getModelToken(CommunityMemberModel),
          useValue: communityMemberModel,
        },
        {
          provide: getModelToken(GroupModel),
          useValue: groupModel,
        },
        {
          provide: getModelToken(GroupMemberModel),
          useValue: groupMemberModel,
        },
        {
          provide: getModelToken(RoleModel),
          useValue: roleModel,
        },
        { provide: SentryService, useValue: sentryServiceMock },
      ],
    }).compile();

    caslAbilityFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Function - createForUser', () => {
    it('should get abilities from cache if exist', async () => {
      const userId = 1;
      const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
      const cachedAbilities = [];

      redisCacheService.get.mockResolvedValue(cachedAbilities);

      const result = await caslAbilityFactory.createForUser(userId);

      expect(result).toStrictEqual(new Ability(cachedAbilities));
      expect(redisCacheService.get).toBeCalledWith(cacheKey);
      expect(redisCacheService.set).not.toBeCalled();
      expect(communityModel.findAll).not.toBeCalled();
      expect(groupModel.findAll).not.toBeCalled();
      expect(roleModel.findAll).not.toBeCalled();
    });

    it('should return Ability and cache into redis', async () => {
      const userId = 1;
      const ownCommunities = [
        { id: 1, groupId: 10 },
        { id: 2, groupId: 20 },
      ];
      const ownGroups = [
        { id: 10 },
        { id: 11 },
        { id: 12 },
        { id: 20 },
        { id: 21 },
      ];
      const commMembers = [
        {
          userId,
          communityId: 3,
          isAdmin: true,
          customRoleIds: [],
          community: {
            groupId: 30,
            schemeId: 'scheme-3',
          },
        },
        {
          userId,
          communityId: 4,
          isAdmin: false,
          customRoleIds: ['role-1', 'role-2'],
          community: {
            groupId: 40,
            schemeId: 'scheme-4',
          },
        },
      ];
      const groupMembers = [
        {
          userId,
          groupId: 301,
          isAdmin: true,
          customRoleIds: [],
          group: {
            parents: [3],
            schemeId: 'scheme-3',
          },
        },
        {
          userId,
          groupId: 401,
          isAdmin: false,
          customRoleIds: ['role-3'],
          group: {
            parents: [4],
            scheme: 'scheme-5',
          },
        },
      ];

      const groupMembersWithCommRole = [
        {
          userId,
          groupId: 301,
          isAdmin: true,
          schemeId: 'scheme-3',
          isCommAdmin: true,
          customRoleIds: [],
          commSchemeId: 'scheme-3',
        },
        {
          userId,
          groupId: 401,
          isAdmin: false,
          schemeId: 'scheme-5',
          isCommAdmin: false,
          customRoleIds: ['role-1', 'role-2', 'role-3'],
          commSchemeId: 'scheme-4',
        },
      ];

      const needRoles = [];

      const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
      const roles = [];

      const abilities = [];
      const noSubjectAbilities = [];

      redisCacheService.get.mockResolvedValueOnce(null);
      communityModel.findAll.mockResolvedValue(ownCommunities);
      groupModel.findAll.mockResolvedValue(ownGroups);
      communityMemberModel.findAll.mockResolvedValue(commMembers);
      groupMemberModel.findAll.mockResolvedValue(groupMembers);
      roleModel.findAll.mockResolvedValue(roles);

      const getNeededRolesSpy = jest.spyOn(
        caslAbilityFactory,
        'getNeededRoles'
      );
      getNeededRolesSpy.mockResolvedValue(needRoles);

      const buildBasicPermissionsForBeinUserSpy = jest.spyOn(
        caslAbilityFactory,
        'buildBasicPermissionsForBeinUser'
      );
      buildBasicPermissionsForBeinUserSpy.mockImplementation(
        (noSubjectAbilities) => {
          return noSubjectAbilities;
        }
      );

      const buildPermissionsForAccountOwnerSpy = jest.spyOn(
        caslAbilityFactory,
        'buildPermissionsForAccountOwner'
      );
      buildPermissionsForAccountOwnerSpy.mockImplementation();

      const buildPermissionsInCommunitySpy = jest.spyOn(
        caslAbilityFactory,
        'buildPermissionsInCommunity'
      );
      buildPermissionsInCommunitySpy.mockImplementation();

      const bindCommRoleToGroupMemberSpy = jest.spyOn(
        caslAbilityFactory,
        'bindCommRoleToGroupMember'
      );
      bindCommRoleToGroupMemberSpy.mockReturnValue(groupMembersWithCommRole);

      const buildPermissionsInGroupsSpy = jest.spyOn(
        caslAbilityFactory,
        'buildPermissionsInGroups'
      );
      buildPermissionsInGroupsSpy.mockImplementation();

      const result = await caslAbilityFactory.createForUser(userId);

      expect(result).toStrictEqual(new Ability(abilitiesMock as any));
      expect(redisCacheService.get).toBeCalledWith(cacheKey);
      expect(redisCacheService.set).toBeCalledWith(cacheKey, abilitiesMock, {
        ttl: TTL_CACHE.PERMISSION_CACHE,
      });
      expect(communityModel.findAll).toBeCalledWith({
        where: { ownerId: userId },
      });
      expect(groupModel.findAll).toBeCalledWith({
        where: {
          [Op.or]: [
            { id: [10, 20] },
            {
              parents: {
                [Op.overlap]: [10, 20],
              },
            },
          ],
        },
      });

      expect(communityMemberModel.findAll).toBeCalledWith({
        where: { userId },
        include: [
          {
            model: CommunityModel,
            as: 'community',
            attributes: ['schemeId', 'groupId'],
            where: {
              id: {
                [Op.notIn]: [1, 2],
              },
            },
          },
        ],
      });
      expect(groupMemberModel.findAll).toBeCalledWith({
        where: { userId },
        include: [
          {
            model: GroupModel,
            as: 'group',
            attributes: ['schemeId', 'parents'],
            where: {
              id: {
                [Op.notIn]: ownGroups.map(({ id }) => id),
              },
            },
          },
        ],
      });
      expect(getNeededRolesSpy).toBeCalledWith(commMembers, groupMembers);
      expect(buildBasicPermissionsForBeinUserSpy).toBeCalledWith(
        noSubjectAbilities
      );
      expect(buildPermissionsForAccountOwnerSpy).toBeCalledWith(
        ownCommunities,
        ownGroups,
        abilities
      );
      expect(buildPermissionsInCommunitySpy).toBeCalledWith(
        commMembers,
        roles,
        abilities,
        noSubjectAbilities
      );
      expect(bindCommRoleToGroupMemberSpy).toBeCalledWith(
        groupMembers,
        commMembers
      );
      expect(buildPermissionsInGroupsSpy).toBeCalledWith(
        groupMembersWithCommRole,
        roles,
        abilities,
        noSubjectAbilities
      );
    });

    it('should handle error when getting cache and throw internal error', async () => {
      const userId = 1;
      const errorMock = new Error('jest-test-error');
      redisCacheService.get.mockRejectedValueOnce(errorMock);

      redisCacheService.set.mockRejectedValueOnce(new Error('jest-test-error'));

      const result = await caslAbilityFactory
        .createForUser(userId)
        .then((res) => res)
        .catch((err) => err);

      expect(result).toStrictEqual(new InternalServerErrorException(errorMock));
    });

    it('should handle error when getting communities and throw internal error', async () => {
      const userId = 1;
      const errorMock = new Error('jest-test-error');
      redisCacheService.get.mockResolvedValue(null);

      communityModel.findAll.mockRejectedValueOnce(errorMock);

      const result = await caslAbilityFactory
        .createForUser(userId)
        .then((res) => res)
        .catch((err) => err);

      expect(result).toStrictEqual(new InternalServerErrorException(errorMock));
    });

    it('should handle error when getting groups and throw internal error', async () => {
      const userId = 1;
      const errorMock = new Error('jest-test-error');
      redisCacheService.get.mockResolvedValue(null);

      groupModel.findAll.mockRejectedValueOnce(errorMock);

      const result = await caslAbilityFactory
        .createForUser(userId)
        .then((res) => res)
        .catch((err) => err);

      expect(result).toStrictEqual(new InternalServerErrorException(errorMock));
    });
  });

  describe('createForStaff', () => {
    it('should add manage_all ability if the user is SUPER_ADMIN', async () => {
      const ability = await caslAbilityFactory.createForStaff(
        BeinStaffRole.SUPER_ADMIN
      );

      expect(ability.can('manage', subject('all', {}))).toBeTruthy();
      expect(ability.can('delete', subject('all', {}))).toBeTruthy();
      expect(ability.can('manage', subject('staff', {}))).toBeTruthy();
    });

    it('should deny manage_staff and delete_all abilities if the user is STAFF', async () => {
      const ability = await caslAbilityFactory.createForStaff(
        BeinStaffRole.STAFF
      );
      expect(ability.can('manage', subject('all', {}))).toBeTruthy();
      expect(ability.can('delete', subject('all', {}))).not.toBeTruthy();
      expect(ability.can('manage', subject('staff', {}))).not.toBeTruthy();
    });
  });
});

const abilitiesMock = [];
