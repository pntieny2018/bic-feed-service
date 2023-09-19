import { createMock } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { ArticleDomainService } from '../../../domain/domain-service/article.domain-service';
import {
  IArticleDomainService,
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  ArticleDeletedEvent,
  ArticlePublishedEvent,
  ArticleUpdatedEvent,
} from '../../../domain/event';
import {
  ContentAccessDeniedException,
  ContentEmptyContentException,
  ContentHasBeenPublishedException,
  ContentNotFoundException,
} from '../../../domain/exception';
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
  let domainService: IArticleDomainService;
  let eventBus$: EventBus;
  let contentRepository: IContentRepository;
  let articleValidator: IArticleValidator;

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
    domainService = module.get<IArticleDomainService>(ArticleDomainService);
    contentRepository = module.get<IContentRepository>(CONTENT_REPOSITORY_TOKEN);
    articleValidator = module.get<IArticleValidator>(ARTICLE_VALIDATOR_TOKEN);

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

  describe('autoSave', () => {
    it('should auto save article', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(false);
      jest.spyOn(domainService as any, '_setArticleEntityAttributes').mockImplementation(jest.fn());
      jest.spyOn(articleValidator, 'validateArticle').mockImplementation(jest.fn());
      jest.spyOn(articleEntityMock, 'isChanged').mockReturnValueOnce(true);

      await domainService.autoSave({
        id: 'id',
        actor: userMock,
      });
      expect(contentRepository.update).toBeCalledWith(articleEntityMock);
    });

    it('should not auto save article when article not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(undefined);
      try {
        await domainService.autoSave({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not auto save article when article is published', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(true);
      try {
        await domainService.autoSave({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
      }
    });

    it('should not auto save article when article is not changed', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isChanged').mockReturnValueOnce(false);
      try {
        await domainService.autoSave({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
      }
    });
  });

  describe('update', () => {
    it('should update article successfully', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(false);
      jest.spyOn(domainService as any, '_setArticleEntityAttributes').mockImplementation(jest.fn());
      jest.spyOn(articleValidator, 'validateArticle').mockImplementation(jest.fn());
      jest.spyOn(articleValidator, 'validateLimitedToAttachSeries').mockImplementation(jest.fn());
      jest.spyOn(articleEntityMock, 'isChanged').mockReturnValueOnce(true);

      await domainService.update({
        id: 'id',
        actor: userMock,
      });
      expect(contentRepository.update).toBeCalledWith(articleEntityMock);
      expect(eventBus$.publish).toBeCalledWith(
        new ArticleUpdatedEvent(articleEntityMock, userMock)
      );
    });

    it('should not update article when article not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(undefined);
      try {
        await domainService.update({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not update article when article is hidden', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isHidden').mockReturnValueOnce(true);
      try {
        await domainService.update({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not update article when article is not changed', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isChanged').mockReturnValueOnce(false);
      try {
        await domainService.update({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
      }
    });
  });

  describe('publish', () => {
    it('should publish article successfully', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isHidden').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isValidArticleToPublish').mockReturnValueOnce(true);
      jest.spyOn(articleValidator, 'validateArticle').mockImplementation(jest.fn());
      jest.spyOn(articleValidator, 'validateLimitedToAttachSeries').mockImplementation(jest.fn());

      const result = await domainService.publish({
        id: 'id',
        actor: userMock,
      });
      expect(contentRepository.update).toBeCalledWith(articleEntityMock);
      expect(eventBus$.publish).toBeCalledWith(
        new ArticlePublishedEvent(articleEntityMock, userMock)
      );
      expect(result).toEqual(articleEntityMock);
    });

    it('should not publish article when article not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(undefined);
      try {
        await domainService.publish({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not publish article when article is published', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(true);
      jest.spyOn(articleEntityMock, 'isHidden').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(false);
      const res = await domainService.publish({
        id: 'id',
        actor: userMock,
      });
      expect(eventBus$.publish).toBeCalledTimes(0);
      expect(res).toEqual(articleEntityMock);
    });

    it('should not publish article when article is hidden', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isHidden').mockReturnValueOnce(true);
      try {
        await domainService.publish({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not publish article when article is in archived groups', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(true);
      try {
        await domainService.publish({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not publish article when article is not valid to publish', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isValidArticleToPublish').mockReturnValueOnce(false);
      try {
        await domainService.publish({
          id: 'id',
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentEmptyContentException);
      }
    });
  });

  describe('schedule', () => {
    const payload = {
      id: v4(),
      scheduledAt: new Date(),
    };
    it('should schedule article successfully', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isHidden').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isValidArticleToPublish').mockReturnValueOnce(true);
      jest.spyOn(articleValidator, 'validateArticle').mockImplementation(jest.fn());
      jest.spyOn(articleValidator, 'validateLimitedToAttachSeries').mockImplementation(jest.fn());

      const result = await domainService.schedule({
        payload,
        actor: userMock,
      });
      expect(contentRepository.update).toBeCalledWith(articleEntityMock);
      expect(result).toEqual(articleEntityMock);
    });

    it('should not schedule article when article not found', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(undefined);
      try {
        await domainService.schedule({
          payload,
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not schedule article when article is published', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isPublished').mockReturnValueOnce(true);
      jest.spyOn(articleEntityMock, 'isHidden').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(false);
      try {
        await domainService.schedule({
          payload,
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentHasBeenPublishedException);
      }
    });

    it('should not schedule article when article is hidden', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isHidden').mockReturnValueOnce(true);
      try {
        await domainService.schedule({
          payload,
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not schedule article when article is in archived groups', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(true);
      try {
        await domainService.schedule({
          payload,
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should not schedule article when article is not valid to publish', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(articleEntityMock, 'isInArchivedGroups').mockReturnValueOnce(false);
      jest.spyOn(articleEntityMock, 'isValidArticleToPublish').mockReturnValueOnce(false);
      try {
        await domainService.schedule({
          payload,
          actor: userMock,
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ContentEmptyContentException);
      }
    });
  });
});
