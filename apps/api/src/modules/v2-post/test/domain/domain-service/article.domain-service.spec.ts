import { createMock } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { ArticleDomainService } from '../../../domain/domain-service/article.domain-service';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/media.domain-service.interface';
import {
  CATEGORY_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICategoryRepository,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import {
  ARTICLE_VALIDATOR_TOKEN,
  CATEGORY_VALIDATOR_TOKEN,
  CONTENT_VALIDATOR_TOKEN,
  IArticleValidator,
  ICategoryValidator,
  IContentValidator,
} from '../../../domain/validator/interface';
import { userMock } from '../../mock/user.dto.mock';

describe('Article domain service', () => {
  let domainService: ArticleDomainService;
  let eventBus$: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleDomainService,
        {
          provide: MEDIA_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IMediaDomainService>(),
        },
        {
          provide: ARTICLE_VALIDATOR_TOKEN,
          useValue: createMock<IArticleValidator>(),
        },
        {
          provide: CATEGORY_VALIDATOR_TOKEN,
          useValue: createMock<ICategoryValidator>(),
        },
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: createMock<ICategoryRepository>(),
        },
        {
          provide: CONTENT_REPOSITORY_TOKEN,
          useValue: createMock<IContentRepository>(),
        },
        {
          provide: TAG_REPOSITORY_TOKEN,
          useValue: createMock<ITagRepository>(),
        },
        {
          provide: CONTENT_VALIDATOR_TOKEN,
          useValue: createMock<IContentValidator>(),
        },
        {
          provide: EventBus,
          useFactory: () => jest.fn(),
        },
      ],
    }).compile();
    eventBus$ = module.get<EventBus>(EventBus);
    domainService = module.get<ArticleDomainService>(ArticleDomainService);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    eventBus$.publish = jest.fn(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getArticleById', () => {
    it('should get article by id', async () => {
      const articleEntity = await domainService.getArticleById('articleId', userMock);
      expect(articleEntity).toBeDefined();
    });
  });
});
