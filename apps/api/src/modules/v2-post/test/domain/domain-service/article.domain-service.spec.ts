import { createMock } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { ArticleDomainService } from '../../../domain/domain-service/article.domain-service';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/media.domain-service.interface';
import { ArticleDeletedEvent } from '../../../domain/event';
import { ContentAccessDeniedException, ContentNotFoundException } from '../../../domain/exception';
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
import { articleEntityMock } from '../../mock/article.entity.mock';
import { userMock } from '../../mock/user.dto.mock';

describe('Article domain service', () => {
  let domainService: ArticleDomainService;
  let eventBus$: EventBus;
  let contentRepository: IContentRepository;

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
    contentRepository = module.get<IContentRepository>(CONTENT_REPOSITORY_TOKEN);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    eventBus$.publish = jest.fn(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getArticleById', () => {
    it('should get article by id', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);

      const articleEntity = await domainService.getArticleById('articleId', userMock);
      expect(articleEntity).toEqual(articleEntityMock);
    });

    it('should throw error when article not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(undefined);
      try {
        await domainService.getArticleById('articleId', userMock);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should throw error when authUser not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      try {
        await domainService.getArticleById('articleId', undefined);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
      }
    });
  });

  describe('deleteArticle', () => {
    const id = v4();
    it('should delete article', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(contentRepository, 'delete').mockResolvedValueOnce(undefined);

      await domainService.deleteArticle({
        id,
        actor: userMock,
      });

      expect(eventBus$.publish).toBeCalledWith(
        new ArticleDeletedEvent(articleEntityMock, userMock)
      );
    });

    it('should throw error when article not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(undefined);
      try {
        await domainService.deleteArticle({
          id,
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should throw error when authUser not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      try {
        await domainService.deleteArticle({
          id,
          actor: { ...userMock, id: 'anotherUserId' },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
      }
    });
  });
});
