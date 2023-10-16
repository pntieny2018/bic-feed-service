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
import { userDto, userDtoWithoutGroup, userMocked, userPermissions } from '../mock/user.dto.mock';

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
    it('Should returned a MediaDto', async () => {
      const userEntityMocked = new UserEntity({ ...userMocked });
      jest.spyOn(repo, 'findByUserName').mockResolvedValue(userEntityMocked);
      repo.findByUserName = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findByUserName(userMocked.username, {
        withGroupJoined: false,
      });
      expect(repo.findByUserName).toBeCalledWith(userMocked.username);
      expect(result).toEqual(userDtoWithoutGroup);
    });

    it('Should returned a MediaDto with group', async () => {
      const userEntityMocked = new UserEntity({ ...userMocked });
      jest.spyOn(repo, 'findByUserName').mockResolvedValue(userEntityMocked);
      repo.findByUserName = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findByUserName(userMocked.username, {
        withGroupJoined: true,
      });
      expect(repo.findByUserName).toBeCalledWith(userMocked.username);
      expect(result).toEqual(userDto);
    });

    it('Should returned null', async () => {
      jest.spyOn(repo, 'findByUserName').mockResolvedValue(null);
      repo.findByUserName = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findByUserName(userMocked.username);
      expect(repo.findByUserName).toBeCalledWith(userMocked.username);
      expect(result).toEqual(null);
    });

    it('Should returned null because property is empty', async () => {
      const result = await userAppService.findByUserName('');
      expect(result).toEqual(null);
    });
  });

  describe('UserApplicationService.findOne', () => {
    it('Should returned a MediaDto without group', async () => {
      const userEntityMocked = new UserEntity({ ...userMocked });
      jest.spyOn(repo, 'findOne').mockResolvedValue(userEntityMocked);
      repo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findOne(userMocked.id, {
        withGroupJoined: false,
        withPermission: true,
      });
      expect(repo.findOne).toBeCalledWith(userMocked.id);
      expect(result).toEqual(new UserDto({ ...userDtoWithoutGroup }));
    });

    it('Should returned a MediaDto with group', async () => {
      const userEntityMocked = new UserEntity({ ...userMocked });
      jest.spyOn(repo, 'findOne').mockResolvedValue(userEntityMocked);
      repo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findOne(userMocked.id, {
        withGroupJoined: true,
        withPermission: true,
      });
      expect(repo.findOne).toBeCalledWith(userMocked.id);
      expect(result).toEqual(new UserDto({ ...userDto }));
    });

    it('Should returned a MediaDto without permission', async () => {
      const userEntityMocked = new UserEntity({ ...userMocked });
      jest.spyOn(repo, 'findOne').mockResolvedValue(userEntityMocked);
      repo.findOne = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findOne(userMocked.id, {
        withGroupJoined: true,
        withPermission: false,
      } as FindUserOption);
      expect(repo.findOne).toBeCalledWith(userMocked.id);
      expect(result).toEqual(userDto);
    });

    it('Should returned null', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      const result = await userAppService.findOne(userMocked.id);
      expect(result).toEqual(null);
    });

    it('Should returned null because propety is empty', async () => {
      const result = await userAppService.findOne('');
      expect(result).toEqual(null);
    });
  });

  describe('UserApplicationService.findAllByIds', () => {
    it('Should returned a list MediaDto without group', async () => {
      const userEntityMocked = new UserEntity({ ...userMocked });
      jest.spyOn(repo, 'findAllByIds').mockResolvedValue([userEntityMocked]);
      repo.findAllByIds = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findAllByIds([userMocked.id], {
        withGroupJoined: false,
      } as FindUserOption);
      expect(repo.findAllByIds).toBeCalledWith([userMocked.id]);
      expect(result).toEqual([userDtoWithoutGroup]);
    });

    it('Should returned a list MediaDto with group', async () => {
      const userEntityMocked = new UserEntity({ ...userMocked });
      jest.spyOn(repo, 'findAllByIds').mockResolvedValue([userEntityMocked]);
      repo.findAllByIds = jest.fn().mockResolvedValue(Promise.resolve());
      const result = await userAppService.findAllByIds([userMocked.id], {
        withGroupJoined: true,
      } as FindUserOption);
      expect(repo.findAllByIds).toBeCalledWith([userMocked.id]);
      expect(result).toEqual([userDto]);
    });

    it('Should returned a empty list', async () => {
      jest.spyOn(repo, 'findAllByIds').mockResolvedValue([]);
      const result = await userAppService.findAllByIds([]);
      expect(result).toEqual([]);
    });
  });

  describe('UserApplicationService.canCudTagInCommunityByUserId', () => {
    it('Should returned a boolean', async () => {
      jest.spyOn(repo, 'canCudTagInCommunityByUserId').mockResolvedValue(false);
      const result = await userAppService.canCudTagInCommunityByUserId(
        userMocked.id,
        Object.keys(userPermissions.communities)[0]
      );
      expect(result).toEqual(false);
    });
  });
});
