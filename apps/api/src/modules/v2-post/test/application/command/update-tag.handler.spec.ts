import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { StringHelper } from '../../../../../common/helpers';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserApplicationService,
} from '../../../../v2-user/application';
import { UpdateTagCommand, UpdateTagHandler } from '../../../application/command/tag';
import { TagDomainService } from '../../../domain/domain-service';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  TagDuplicateNameException,
  TagNotFoundException,
  TagNoUpdatePermissionException,
} from '../../../domain/exception';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { createMockUserDto } from '../../mock/user.mock';

const userMock = createMockUserDto();

describe('UpdateTagHandler', () => {
  let handler: UpdateTagHandler;
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  let userAppService: IUserApplicationService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTagHandler,
        {
          provide: TAG_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<TagDomainService>(),
        },
        {
          provide: USER_APPLICATION_TOKEN,
          useValue: createMock<UserApplicationService>(),
        },
        {
          provide: TAG_REPOSITORY_TOKEN,
          useValue: createMock<TagRepository>(),
        },
      ],
    }).compile();

    handler = module.get<UpdateTagHandler>(UpdateTagHandler);
    domainService = module.get(TAG_DOMAIN_SERVICE_TOKEN);
    repo = module.get(TAG_REPOSITORY_TOKEN);
    userAppService = module.get(USER_APPLICATION_TOKEN);
    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const id = v4();
    const name = StringHelper.randomStr(10);
    const tag = new TagEntity({
      id: id,
      groupId: v4(),
      name: name,
      slug: StringHelper.convertToSlug(name),
      totalUsed: 0,
      updatedBy: userMock.id,
      createdBy: userMock.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    it('should update tag name success', async () => {
      const newName = 'new name ' + name;
      const command = new UpdateTagCommand({ id, name: newName, userId: userMock.id });
      const spyRepoFindOne = jest.spyOn(repo, 'findOne').mockResolvedValue(tag);
      const spyCanCUDTag = jest
        .spyOn(userAppService, 'canCudTagInCommunityByUserId')
        .mockResolvedValue(true);
      await handler.execute(command);

      expect(spyRepoFindOne).toBeCalledWith({ id });
      expect(spyCanCUDTag).toBeCalledWith(userMock.id, tag.get('groupId'));
      expect(domainService.updateTag).toBeCalledWith(tag, {
        id,
        name: newName,
        userId: userMock.id,
      });
    });

    it('should throw error when no permission', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const newName = 'new name ' + name;
      const command = new UpdateTagCommand({ id, name: newName, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tag);
      jest.spyOn(userAppService, 'canCudTagInCommunityByUserId').mockResolvedValue(false);
      await expect(handler.execute(command)).rejects.toThrowError(TagNoUpdatePermissionException);
    });

    it('should throw error when tag not found', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const newName = 'new name ' + name;
      const command = new UpdateTagCommand({ id, name: newName, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError(TagNotFoundException);
    });

    it('should throw error when tag name is empty', async () => {
      const id = v4();
      const name = StringHelper.randomStr(10);
      const tag = new TagEntity({
        id: id,
        groupId: v4(),
        name: name,
        slug: StringHelper.convertToSlug(name),
        totalUsed: 0,
        updatedBy: userMock.id,
        createdBy: userMock.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const command = new UpdateTagCommand({ id: v4(), name: name, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tag);
      await expect(handler.execute(command)).rejects.toThrowError(TagDuplicateNameException);
    });
  });
});
