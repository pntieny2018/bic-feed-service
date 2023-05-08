import { Test, TestingModule } from '@nestjs/testing';
import {
  FindUserOption,
  IUserApplicationService,
  UserApplicationService,
  UserDto,
} from '../../application';
import { createMock } from '@golevelup/ts-jest';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../domain/repositoty-interface/user.repository.interface';
import { UserRepository } from '../../driven-adapter/repository/user.repository';
import { UserEntity } from '../../domain/model/user';
import { userMocked, userPermissions } from '../mock/user.dto.mock';

describe('UserApplicationService', () => {
  let userAppService: IUserApplicationService;
  let repo: IUserRepository;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserApplicationService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: createMock<UserRepository>(),
        },
      ],
    }).compile();
    userAppService = module.get<UserApplicationService>(UserApplicationService);
    repo = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UserApplicationService.findByUserName', () => {
    const userEntityMocked = new UserEntity(userMocked);
    it('Should returned a UserDto', async () => {
      jest.spyOn(repo, 'findByUserName').mockResolvedValue(userEntityMocked);
      const result = await userAppService.findByUserName(userMocked.username, {
        withGroupJoined: false,
      });
      delete userMocked.groups;
      expect(result).toEqual(new UserDto(userMocked));
    });

    it('Should returned a UserDto with group', async () => {
      jest.spyOn(repo, 'findByUserName').mockResolvedValue(userEntityMocked);
      const result = await userAppService.findByUserName(userMocked.username);
      delete userMocked.groups;
      expect(result).toEqual(new UserDto(userMocked));
    });

    it('Should returned null', async () => {
      jest.spyOn(repo, 'findByUserName').mockResolvedValue(null);
      const result = await userAppService.findByUserName(userMocked.username, {
        withGroupJoined: false,
      });
      delete userMocked.groups;
      expect(result).toEqual(null);
    });

    it('Should returned null because property is empty', async () => {
      const result = await userAppService.findByUserName('');
      expect(result).toEqual(null);
    });
  });

  describe('UserApplicationService.findOne', () => {
    const userEntityMocked = new UserEntity(userMocked);
    it('Should returned a UserDto', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(userEntityMocked);
      jest.spyOn(repo, 'getPermissionsByUserId').mockResolvedValue(userPermissions);
      const result = await userAppService.findOne(userMocked.username, {
        withGroupJoined: false,
        withPermission: true,
      } as FindUserOption);
      const { groups, ...rest } = userMocked;
      expect(result).toEqual(new UserDto({ ...rest, permissions: userPermissions }));
    });

    it('Should returned a UserDto with group', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(userEntityMocked);
      jest.spyOn(repo, 'getPermissionsByUserId').mockResolvedValue(userPermissions);
      const result = await userAppService.findOne(userMocked.username);
      expect(result).toEqual(new UserDto({ ...userMocked, permissions: userPermissions }));
    });

    it('Should returned null', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      const result = await userAppService.findOne(userMocked.username);
      expect(result).toEqual(null);
    });

    it('Should returned null because propety is empty', async () => {
      const result = await userAppService.findOne('');
      expect(result).toEqual(null);
    });
  });

  describe('UserApplicationService.findAllByIds', () => {
    const userEntityMocked = new UserEntity(userMocked);
    it('Should returned a list UserDto', async () => {
      jest.spyOn(repo, 'findAllByIds').mockResolvedValue([userEntityMocked]);
      const result = await userAppService.findAllByIds([userMocked.id], {
        withGroupJoined: false,
      } as FindUserOption);
      const { groups, ...rest } = userMocked;
      expect(result).toEqual([new UserDto(userMocked)]);
    });

    it('Should returned a list UserDto with group', async () => {
      jest.spyOn(repo, 'findAllByIds').mockResolvedValue([userEntityMocked]);
      const result = await userAppService.findAllByIds([userMocked.id]);
      const { groups, ...rest } = userMocked;
      expect(result).toEqual([new UserDto(userMocked)]);
    });
  });

  describe('UserApplicationService.canCudTagInCommunityByUserId', () => {
    it('Should returned a list UserDto', async () => {
      jest.spyOn(repo, 'canCudTagInCommunityByUserId').mockResolvedValue(false);
      const result = await userAppService.canCudTagInCommunityByUserId(
        userMocked.id,
        Object.keys(userPermissions.communities)[0]
      );
      expect(result).toEqual(false);
    });
  });
});
