import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { StringHelper } from '../../../../../common/helpers';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { UserId } from '../../../../v2-user/domain/model/user';
import { TagDomainService } from '../../../domain/domain-service';
import { ITagDomainService } from '../../../domain/domain-service/interface';
import { ITagFactory, TagFactory, TAG_FACTORY_TOKEN } from '../../../domain/factory';
import { TagEntity, TagId, TagName } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { userMock } from '../../mock/user.dto.mock';
import { DatabaseException } from '../../../../../common/exceptions/database.exception';
import { I18nContext } from 'nestjs-i18n';
describe('TagDomainService', () => {
  let domainService: ITagDomainService;
  let repo: ITagRepository;
  let factory: ITagFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagDomainService,
        {
          provide: TAG_FACTORY_TOKEN,
          useValue: createMock<TagFactory>(),
        },
        {
          provide: TAG_REPOSITORY_TOKEN,
          useValue: createMock<TagRepository>(),
        },
      ],
    }).compile();

    domainService = module.get<TagDomainService>(TagDomainService);
    repo = module.get(TAG_REPOSITORY_TOKEN);
    factory = module.get(TAG_FACTORY_TOKEN);
    jest.spyOn(I18nContext, 'current').mockImplementation(() => ({
      t: (...args) => {}
    } as any));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  const tagEntity = TagEntity.fromJson(tagRecord);

  describe('createTag', () => {
    it('Should create tag success', async () => {
      jest.spyOn(factory, 'create').mockReturnValue(tagEntity);
      jest.spyOn(repo, 'create').mockResolvedValue(undefined);

      const result = await domainService.createTag({
        name: TagName.fromString(tagRecord.name),
        groupId: GroupId.fromString(tagRecord.groupId),
        userId: UserId.fromString(tagRecord.createdBy),
      });
      expect(factory.create).toBeCalledWith({
        name: TagName.fromString(tagRecord.name),
        groupId: GroupId.fromString(tagRecord.groupId),
        userId: UserId.fromString(tagRecord.createdBy),
      });

      expect(repo.create).toBeCalledWith(tagEntity);
      expect(result).toEqual(tagEntity);
    });

    it('Should throw error when tag name is existed', async () => {
      const error = new Error('Tag name is existed');
      jest.spyOn(factory, 'create').mockReturnValue(tagEntity);
      jest.spyOn(repo, 'create').mockRejectedValue(error);
      jest.spyOn(repo, 'create').mockRejectedValue(error);
      try {
        await domainService.createTag({
          name: TagName.fromString(tagRecord.name),
          groupId: GroupId.fromString(tagRecord.groupId),
          userId: UserId.fromString(tagRecord.createdBy),
        });
      } catch (e) {
        expect(e).toEqual(new DatabaseException());
      }
    });
  });

  describe('updateTag', () => {
    it('Should update tag success', async () => {
      const newName = 'dsadasd'
      const tagRecordCopy = { ...tagRecord };
      tagRecordCopy.name = newName;
      const afterUpdateTag = TagEntity.fromJson(tagRecordCopy);
      jest.spyOn(repo, 'update').mockReturnValue(undefined);

      const result = await domainService.updateTag(tagEntity, {
        name: TagName.fromString(newName),
        id: TagId.fromString(tagRecord.id),
        userId: UserId.fromString(tagRecord.updatedBy),
      });
      expect(repo.update).toBeCalledWith(tagEntity);
    })

    it('Should throw error when tag name is existed', async () => {
      const newName = 'dsadasd'
      const error = new Error('Tag name is existed');
      jest.spyOn(repo, 'update').mockRejectedValue(error);
      try {
        await domainService.updateTag(tagEntity, {
          name: TagName.fromString(newName),
          id: TagId.fromString(tagRecord.id),
          userId: UserId.fromString(tagRecord.updatedBy),
        });
      } catch (e) {
        expect(e).toEqual(new DatabaseException());
      }
    });
  })

  describe('deleteTag', () => {
    it('Should delete tag success', async () => {
      jest.spyOn(repo, 'delete').mockReturnValue(undefined);

      const result = await domainService.deleteTag(tagEntity.id);
      expect(repo.delete).toBeCalledWith(tagEntity.id);
    })

    it('Should throw error when tag id not exist', async () => {
      jest.spyOn(repo, 'delete').mockRejectedValue(new Error('Tag id not exist'));
      try {
        await domainService.deleteTag(tagEntity.id);
      } catch (e) {
        expect(e).toEqual(new DatabaseException());
      }
    })
  })
});
