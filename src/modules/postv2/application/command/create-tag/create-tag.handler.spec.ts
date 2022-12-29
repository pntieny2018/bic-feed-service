import { ModuleMetadata, Provider } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Tag } from '../../../domain/model/tag/tag';
import { TagFactory } from '../../../domain/model/tag/tag.factory';
import { TAG_REPOSITORY } from '../../../domain/repositoty-interface/tag.repository.interface';
import { TagRepository } from '../../../infrastructure/repository/tag.repository';
import { CreatetagCommand } from './create-tag.command';
import { CreateTagHandler } from './create-tag.handler';

describe('CreateTagHandler', () => {
  let handler: CreateTagHandler;
  let repository: TagRepository;
  let factory: TagFactory;

  beforeEach(async () => {
    const repoProvider: Provider = {
      provide: TAG_REPOSITORY,
      useValue: {},
    };
    const factoryProvider: Provider = {
      provide: TagFactory,
      useValue: {},
    };
    const providers: Provider[] = [CreateTagHandler, repoProvider, factoryProvider];

    const moduleMetadata: ModuleMetadata = { providers };
    const testModule = await Test.createTestingModule(moduleMetadata).compile();

    handler = testModule.get(CreateTagHandler);
    repository = testModule.get(TAG_REPOSITORY);
    factory = testModule.get(TagFactory);
  });

  describe('execute', () => {
    const mockData = {
      userId: '003e212b-bffb-4467-af75-00eb72f58216',
      tagId: '001aa505-d514-4d94-b663-987778d9def5',
      groupId: '0022ff0d-4c6c-46c5-aa82-f97dcf3b8f08',
      name: 'tag 1',
    };
    it('should throw NotFoundException when account not found', async () => {
      const mockTag = new Tag({
        name: mockData.name,
        groupId: mockData.groupId,
        createdBy: mockData.userId,
        id: mockData.tagId,
        updatedBy: mockData.userId,
      });
      factory.create = jest.fn().mockResolvedValue(mockTag);

      repository.create = jest.fn().mockReturnThis();

      const command = new CreatetagCommand({
        name: mockData.name,
        groupId: mockData.groupId,
        userId: mockData.userId,
      });

      await expect(handler.execute(command)).resolves.toContainEqual(mockTag)
      expect(factory.create).toBeCalledTimes(1);
      expect(factory.create).toBeCalledWith({
        name: mockData.name,
        groupId: mockData.groupId,
        userId: mockData.userId,
      });
      expect(repository.create).toBeCalledTimes(1);
      expect(repository.create).toBeCalledWith(mockTag);
      expect(mockTag.commit).toBeCalledTimes(1);
    });
  });
});
