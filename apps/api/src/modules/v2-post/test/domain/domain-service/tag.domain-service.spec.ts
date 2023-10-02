import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { DatabaseException } from '../../../../../common/exceptions/database.exception';
import { StringHelper } from '../../../../../common/helpers';
import { TagDomainService } from '../../../domain/domain-service';
import { ITagDomainService } from '../../../domain/domain-service/interface';
import { TagFactory } from '../../../domain/factory';
import { ITagFactory, TAG_FACTORY_TOKEN } from '../../../domain/factory/interface';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { TagRepository } from '../../../driven-adapter/repository';
import { createMockUserDto } from '../../mock/user.mock';

const userMock = createMockUserDto();

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
  describe('createTag', () => {
    it('Should create tag success', async () => {
      const factoryCreate = jest.spyOn(factory, 'create').mockReturnValue(tagEntity);
      const repoCreate = jest.spyOn(repo, 'create').mockResolvedValue(undefined);
      const entityCommit = jest.spyOn(tagEntity, 'commit').mockReturnThis();

      const result = await domainService.createTag({
        name: tagRecord.name,
        groupId: tagRecord.groupId,
        userId: tagRecord.createdBy,
      });
      expect(factoryCreate).toBeCalledWith({
        name: tagRecord.name,
        groupId: tagRecord.groupId,
        userId: tagRecord.createdBy,
      });

      expect(repoCreate).toBeCalledWith(tagEntity);
      expect(entityCommit).toBeCalled();
      expect(result).toEqual(tagEntity);
    });

    it('Should throw error when tag name is existed', async () => {
      const logError = jest.spyOn(domainService['_logger'], 'error').mockReturnThis();
      const factoryCreate = jest.spyOn(factory, 'create').mockReturnValue(tagEntity);
      const repoCreate = jest.spyOn(repo, 'create').mockRejectedValue(new Error());
      try {
        await domainService.createTag({
          name: tagRecord.name,
          groupId: tagRecord.groupId,
          userId: tagRecord.createdBy,
        });
      } catch (e) {
        expect(factoryCreate).toBeCalledWith({
          name: tagRecord.name,
          groupId: tagRecord.groupId,
          userId: tagRecord.createdBy,
        });
        expect(repoCreate).toBeCalledWith(tagEntity);
        expect(logError).toBeCalled();
        expect(e).toEqual(new DatabaseException());
      }
    });

    it('Should throw error when tag name is too long', async () => {
      jest.spyOn(factory, 'create').mockReturnValue(tagEntity);
      jest.spyOn(repo, 'create').mockRejectedValue(new Error('Tag name is too long'));
    });
  });

  describe('updateTag', () => {
    it('Should update tag success', async () => {
      const newName = 'dsadasd';
      const tagRecordCopy = { ...tagRecord };
      tagRecordCopy.name = newName;
      const afterUpdateTag = new TagEntity(tagRecordCopy);
      jest.spyOn(repo, 'update').mockReturnValue(undefined);

      const result = await domainService.updateTag(tagEntity, {
        name: newName,
        id: tagRecord.id,
        userId: tagRecord.updatedBy,
      });
      expect(repo.update).toBeCalledWith(tagEntity);
    });

    it('Should throw error when tag name is existed', async () => {
      const newName = 'dsadasd';
      const logError = jest.spyOn(domainService['_logger'], 'error').mockReturnThis();
      jest.spyOn(repo, 'update').mockRejectedValue(new Error());
      try {
        await domainService.updateTag(tagEntity, {
          name: newName,
          id: tagRecord.id,
          userId: tagRecord.updatedBy,
        });
      } catch (e) {
        expect(logError).toBeCalled();
        expect(e).toEqual(new DatabaseException());
      }
    });
  });

  describe('deleteTag', () => {
    it('Should delete tag success', async () => {
      const spyRepoDelete = jest.spyOn(repo, 'delete').mockReturnThis();

      await domainService.deleteTag(tagEntity.get('id'));
      expect(spyRepoDelete).toBeCalledWith(tagEntity.get('id'));
    });

    it('Should throw error when tag id not exist', async () => {
      const spyRepoDelete = jest
        .spyOn(repo, 'delete')
        .mockRejectedValue(new Error('Tag id not exist'));
      const loggerSpy = jest.spyOn(domainService['_logger'], 'error').mockReturnThis();
      try {
        await domainService.deleteTag(tagEntity.get('id'));
      } catch (e) {
        expect(spyRepoDelete).toBeCalledWith(tagEntity.get('id'));
        expect(e).toEqual(new DatabaseException());
        expect(loggerSpy).toBeCalled();
      }
    });
  });
});
