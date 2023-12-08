import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { IContentBinding, CONTENT_BINDING_TOKEN } from '../../../../application/binding';
import { CreateDraftArticleHandler } from '../../../../application/command/article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { createMockArticleDto, createMockArticleEntity, createMockUserDto } from '../../../mock';

import clearAllMocks = jest.clearAllMocks;

const articleEntityMock = createMockArticleEntity();
const articleDtoMock = createMockArticleDto();
const userMock = createMockUserDto();

describe('CreateDraftArticleHandler', () => {
  let handler: CreateDraftArticleHandler;
  let articleDomainService: IArticleDomainService;
  let contentBinding: IContentBinding;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateDraftArticleHandler,
        {
          provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IArticleDomainService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<IContentBinding>(),
        },
      ],
    }).compile();
    handler = module.get(CreateDraftArticleHandler);
    articleDomainService = module.get(ARTICLE_DOMAIN_SERVICE_TOKEN);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterAll(async () => {
    clearAllMocks();
  });

  describe('execute', () => {
    it('should execute create draft article', async () => {
      jest.spyOn(articleDomainService, 'createDraft').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(contentBinding, 'articleBinding').mockResolvedValueOnce(articleDtoMock);

      const result = await handler.execute({
        payload: {
          authUser: userMock,
          groupIds: [],
        },
      });

      expect(result).toEqual(articleDtoMock);
      expect(articleDomainService.createDraft).toBeCalledWith({
        userId: userMock.id,
        groups: [],
      });
      expect(contentBinding.articleBinding).toBeCalledWith(articleEntityMock, {
        actor: userMock,
        authUser: userMock,
      });
    });
  });
});
