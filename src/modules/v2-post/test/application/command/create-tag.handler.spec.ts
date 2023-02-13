import { ModuleMetadata, Provider } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TagDomainService } from '../../../domain/domain-service/tag.domain-service';
import { TagFactory } from '../../../domain/factory/tag.factory';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { CreateTagHandler } from '../../../application/command/create-tag/create-tag.handler';

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
    repository = testModule.get(TAG_REPOSITORY_TOKEN);
    domainService = testModule.get(TagDomainService);
  });

  describe('execute', () => {
    it('should create success', async () => {
    });
  });
});
