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
import { CreateTagCommand, CreateTagHandler } from '../../../application/command/tag';
import { TagDomainService } from '../../../domain/domain-service';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  TagDuplicateNameException,
  TagNoCreatePermissionException,
} from '../../../domain/exception';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';

describe('CreateTagHandler', () => {
  let handler: CreateTagHandler;
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  let userAppService: IUserApplicationService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTagHandler,
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

    handler = module.get<CreateTagHandler>(CreateTagHandler);
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
    const tagRecord = {
      id: id,
      groupId: v4(),
      name: name,
      slug: StringHelper.convertToSlug(name),
      totalUsed: 0,
      updatedBy: userMock.id,
      createdBy: userMock.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tagEntity = new TagEntity(tagRecord);
    it('Should create tag success', async () => {
      const spyCanCUDTag = jest
        .spyOn(userAppService, 'canCudTagInCommunityByUserId')
        .mockResolvedValue(true);
      const spyServiceCreateTag = jest
        .spyOn(domainService, 'createTag')
        .mockResolvedValue(tagEntity);
      const spyRepoFindOne = jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      });
      const result = await handler.execute(command);
      expect(spyCanCUDTag).toBeCalledWith(userMock.id, tagEntity.get('groupId'));
      expect(spyServiceCreateTag).toBeCalledWith({
        name,
        groupId: tagRecord.groupId,
        userId: tagRecord.createdBy,
      });
      expect(spyRepoFindOne).toBeCalledWith({
        name: tagRecord.name,
        groupId: tagRecord.groupId,
      });

      expect(domainService.createTag).toBeCalledWith({
        name: tagRecord.name,
        groupId: tagRecord.groupId,
        userId: tagRecord.createdBy,
      });

      expect(result).toEqual({
        id: tagEntity.get('id'),
        name: tagEntity.get('name'),
        groupId: tagEntity.get('groupId'),
        slug: tagEntity.get('slug'),
        totalUsed: tagEntity.get('totalUsed'),
      });
    });

    it('should throw error when no permission', async () => {
      const name = StringHelper.randomStr(10);
      const newName = 'new name ' + name;
      const command = new CreateTagCommand({
        name: newName,
        groupId: tagRecord.groupId,
        userId: userMock.id,
      });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tagEntity);
      jest.spyOn(userAppService, 'canCudTagInCommunityByUserId').mockResolvedValue(false);
      await expect(handler.execute(command)).rejects.toThrowError(TagNoCreatePermissionException);
    });

    it('Should throw error when tag name is duplicate', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(tagEntity);
      jest.spyOn(userAppService, 'canCudTagInCommunityByUserId').mockResolvedValue(true);
      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      });
      await expect(handler.execute(command)).rejects.toThrowError(TagDuplicateNameException);
    });
  });
});
