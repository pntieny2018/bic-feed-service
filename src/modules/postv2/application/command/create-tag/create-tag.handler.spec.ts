import { ModuleMetadata, Provider } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TagDomainService } from '../../../domain/domain-service/tag.domain-service';
import { TagFactory } from '../../../domain/factory/tag.factory';
import { TagEntity } from '../../../domain/model/tag';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface/tag.repository.interface';
import { CreateTagCommand } from './create-tag.command';
import { CreateTagHandler } from './create-tag.handler';

describe('CreateTagHandler', () => {
  let handler: CreateTagHandler;
  let repository: ITagRepository;
  let domainService: TagDomainService;

  beforeEach(async () => {
    const repoProvider: Provider = {
      provide: TAG_REPOSITORY_TOKEN,
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
    domainService = testModule.get(TagDomainService);
  });

  describe('execute', () => {
    const mockData = {
      userId: '003e212b-bffb-4467-af75-00eb72f58216',
      tagId: '001aa505-d514-4d94-b663-987778d9def5',
      groupId: '0022ff0d-4c6c-46c5-aa82-f97dcf3b8f08',
      name: 'tag 1',
    };
    it('should create success', async () => {
      // const mockTag = new TagEntity({
      //   name: mockData.name,
      //   groupId: mockData.groupId,
      //   createdBy: mockData.userId,
      //   id: mockData.tagId,
      //   updatedBy: mockData.userId,
      // });
      // factory.create = jest.fn().mockResolvedValue(mockTag);

      // repository.create = jest.fn().mockReturnThis();

      // const command = new CreatetagCommand({
      //   name: mockData.name,
      //   groupId: mockData.groupId,
      //   userId: mockData.userId,
      // });

      // await expect(handler.execute(command)).resolves.toContainEqual(mockTag)
      // expect(factory.create).toBeCalledTimes(1);
      // expect(factory.create).toBeCalledWith({
      //   name: mockData.name,
      //   groupId: mockData.groupId,
      //   userId: mockData.userId,
      // });
      // expect(repository.create).toBeCalledTimes(1);
      // expect(repository.create).toBeCalledWith(mockTag);
      // expect(mockTag.commit).toBeCalledTimes(1);
    });
  });
});
