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
import { DeleteTagCommand, DeleteTagHandler } from '../../../application/command/tag';
import { TagDomainService } from '../../../domain/domain-service';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  TagNoDeletePermissionException,
  TagNotFoundException,
  TagUsedException,
} from '../../../domain/exception';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';

describe('DeleteTagHandler', () => {
  let handler: DeleteTagHandler;
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  let userAppService: IUserApplicationService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTagHandler,
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

    handler = module.get<DeleteTagHandler>(DeleteTagHandler);
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
    it('should delete tag success', async () => {
      const tagEntity = new TagEntity(tagRecord);
      const command = new DeleteTagCommand({ id, userId: userMock.id });
      const spyRepoFindOne = jest.spyOn(repo, 'findOne').mockResolvedValue(tagEntity);
      const spyCanCUDTag = jest
        .spyOn(userAppService, 'canCudTagInCommunityByUserId')
        .mockResolvedValue(true);
      await handler.execute(command);
      expect(spyRepoFindOne).toBeCalledWith({ id });
      expect(spyCanCUDTag).toBeCalledWith(userMock.id, tagEntity.get('groupId'));
      expect(domainService.deleteTag).toBeCalledWith(tagEntity.get('id'));
    });

    it('should throw error when no permission', async () => {
      const tagEntity = new TagEntity(tagRecord);
      const command = new DeleteTagCommand({ id, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tagEntity);
      jest.spyOn(userAppService, 'canCudTagInCommunityByUserId').mockResolvedValue(false);
      await expect(handler.execute(command)).rejects.toThrowError(TagNoDeletePermissionException);
    });

    it('should throw error when tag not found', async () => {
      const command = new DeleteTagCommand({ id, userId: userMock.id });
      const spyRepoFindOne = jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      jest.spyOn(userAppService, 'canCudTagInCommunityByUserId').mockResolvedValue(true);
      await expect(handler.execute(command)).rejects.toThrowError(TagNotFoundException);
    });

    it('should throw error when tag is used', async () => {
      tagRecord.totalUsed = 1;
      const tagEntity = new TagEntity(tagRecord);
      jest.spyOn(userAppService, 'canCudTagInCommunityByUserId').mockResolvedValue(true);
      const command = new DeleteTagCommand({ id, userId: userMock.id });
      jest.spyOn(repo, 'findOne').mockResolvedValue(tagEntity);
      jest.spyOn(userAppService, 'canCudTagInCommunityByUserId').mockResolvedValue(true);
      await expect(handler.execute(command)).rejects.toThrowError(TagUsedException);
    });
  });
});
