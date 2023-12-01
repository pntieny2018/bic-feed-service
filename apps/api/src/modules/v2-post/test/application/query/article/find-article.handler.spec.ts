import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ContentBinding } from '../../../../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../../application/binding/binding-post/content.binding.interface';
import { FindArticleHandler } from '../../../../application/query/article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { createMockArticleDto, createMockArticleEntity } from '../../../mock/content.mock';
import { groupDtoMock } from '../../../mock/group.mock';

const articleEntityMock = createMockArticleEntity();
const articleDtoMock = createMockArticleDto();

describe('Find article handler', () => {
  let handler: FindArticleHandler;
  let articleDomainService: IArticleDomainService;
  let groupAdapter: IGroupAdapter;
  let contentBinding: ContentBinding;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindArticleHandler,
        {
          provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IArticleDomainService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<ContentBinding>(),
        },
        {
          provide: GROUP_ADAPTER,
          useValue: createMock<IGroupAdapter>(),
        },
        {
          provide: POST_VALIDATOR_TOKEN,
          useValue: createMock<IPostValidator>(),
        },
      ],
    }).compile();
    handler = module.get<FindArticleHandler>(FindArticleHandler);
    articleDomainService = module.get(ARTICLE_DOMAIN_SERVICE_TOKEN);
    groupAdapter = module.get(GROUP_ADAPTER);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute find article', async () => {
      jest.spyOn(articleDomainService, 'getArticleById').mockResolvedValue(articleEntityMock);
      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValue([groupDtoMock]);
      jest.spyOn(contentBinding, 'articleBinding').mockResolvedValue(articleDtoMock);

      const result = await handler.execute({ payload: { articleId: '1', authUser: null } });

      expect(result).toEqual(articleDtoMock);
    });
  });
});
