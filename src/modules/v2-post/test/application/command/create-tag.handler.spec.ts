import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { CreateTagCommand } from '../../../application/command/create-tag/create-tag.command';
import { CreateTagHandler } from '../../../application/command/create-tag/create-tag.handler';
import { TagDomainService } from '../../../domain/domain-service/interface';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { userMock } from '../../mock/user.dto.mock';
import { I18nContext } from 'nestjs-i18n';
import { TagRepository } from '../../../driven-adapter/repository';
import { TagDuplicateNameException } from '../../../exception';

describe('CreateTagHandler', () => {
  let handler: CreateTagHandler;
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTagHandler,
        {
          provide: TAG_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<TagDomainService>(),
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
    const tagRecord = {
      id: v4(),
      groupId: v4(),
      name: 'tag bbbdd12 ddffc 1dddf22',
      slug: StringHelper.convertToSlug('tag bbbdd12 ddffc 1dddf22'),
      totalUsed: 0,
      updatedBy: userMock.id,
      createdBy: userMock.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tagEntity = new TagEntity(tagRecord);
    it('Should create tag success', async () => {
      jest.spyOn(domainService, 'createTag').mockResolvedValue(tagEntity);
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      });
      const result = await handler.execute(command);

      expect(repo.findOne).toBeCalledWith({
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

    it('Should throw error when tag name is duplicate', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(tagEntity);

      const command = new CreateTagCommand({
        groupId: tagRecord.groupId,
        name: tagRecord.name,
        userId: tagRecord.createdBy,
      });
      await expect(handler.execute(command)).rejects.toThrowError(TagDuplicateNameException);
    });
  });
});
