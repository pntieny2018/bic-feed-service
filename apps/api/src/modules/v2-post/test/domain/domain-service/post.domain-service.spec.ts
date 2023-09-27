import { createMock } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import {
  IPostDomainService,
  LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PostDomainService } from '../../../domain/domain-service/post.domain-service';
import { ContentAccessDeniedException } from '../../../domain/exception';
import { ArticleEntity, PostEntity } from '../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../domain/service-adapter-interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IMentionValidator,
  IPostValidator,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../../../domain/validator/interface';
import { articleEntityMock } from '../../mock/article.entity.mock';
import { postEntityMock } from '../../mock/post.entity.mock';
import { userMock } from '../../mock/user.dto.mock';

describe('Post domain service', () => {
  let domainService: IPostDomainService;
  let contentRepository: IContentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostDomainService,
        {
          provide: EventBus,
          useValue: createMock<EventBus>(),
        },
        {
          provide: CONTENT_REPOSITORY_TOKEN,
          useValue: createMock<IContentRepository>(),
        },
        {
          provide: POST_VALIDATOR_TOKEN,
          useValue: createMock<IPostValidator>(),
        },
        {
          provide: CONTENT_VALIDATOR_TOKEN,
          useValue: createMock<IContentValidator>(),
        },
        {
          provide: MENTION_VALIDATOR_TOKEN,
          useValue: createMock<IMentionValidator>(),
        },
        {
          provide: LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IMediaDomainService>(),
        },
        {
          provide: TAG_REPOSITORY_TOKEN,
          useValue: createMock<ITagRepository>(),
        },
        {
          provide: MEDIA_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IMediaDomainService>(),
        },
        {
          provide: GROUP_ADAPTER,
          useValue: createMock<IGroupAdapter>(),
        },
        {
          provide: USER_ADAPTER,
          useValue: createMock<IUserAdapter>(),
        },
      ],
    }).compile();
    domainService = module.get<IPostDomainService>(PostDomainService);
    contentRepository = module.get<IContentRepository>(CONTENT_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDraftArticle', () => {
    it('should create draft article successfully', async () => {
      const userId = v4();
      jest.spyOn(contentRepository, 'create').mockResolvedValue();
      jest.spyOn(ArticleEntity, 'create').mockReturnValue(articleEntityMock);
      jest.spyOn(articleEntityMock, 'setGroups').mockImplementation(jest.fn().mockReturnThis());
      jest
        .spyOn(articleEntityMock, 'setPrivacyFromGroups')
        .mockImplementation(jest.fn().mockReturnThis());
      const result = await domainService.createDraftArticle({
        userId,
        groups: [],
      });
      expect(ArticleEntity.create).toBeCalledWith({
        userId,
        groupIds: [],
      });
      expect(result).toEqual(articleEntityMock);
    });

    it('should throw error when create draft article', async () => {
      const userId = v4();
      jest.spyOn(contentRepository, 'create').mockRejectedValue(new Error());
      await expect(
        domainService.createDraftArticle({
          userId,
          groups: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('createDraftPost', () => {
    it('should create draft post successfully', async () => {
      const userId = v4();
      jest.spyOn(contentRepository, 'create').mockResolvedValue();

      jest.spyOn(PostEntity, 'create').mockReturnValue(postEntityMock);
      jest.spyOn(postEntityMock, 'setGroups').mockImplementation(jest.fn().mockReturnThis());
      jest
        .spyOn(postEntityMock, 'setPrivacyFromGroups')
        .mockImplementation(jest.fn().mockReturnThis());
      const result = await domainService.createDraftPost({
        userId,
        groups: [],
      });
      expect(PostEntity.create).toBeCalledWith({
        userId,
        groupIds: [],
      });
      expect(result).toEqual(postEntityMock);
    });

    it('should throw error when create draft post', async () => {
      const userId = v4();
      jest.spyOn(contentRepository, 'create').mockRejectedValue(new Error());
      await expect(
        domainService.createDraftPost({
          userId,
          groups: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('getPostById', () => {
    it('should get post by id successfully', async () => {
      const postId = postEntityMock.getId();
      const authUserId = userMock.id;
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(postEntityMock);
      const result = await domainService.getPostById(postId, authUserId);
      expect(result).toEqual(postEntityMock);
      expect(contentRepository.findOne).toBeCalledWith({
        where: {
          id: postId,
          groupArchived: false,
          excludeReportedByUserId: authUserId,
        },
        include: {
          shouldIncludeGroup: true,
          shouldIncludeSeries: true,
          shouldIncludeLinkPreview: true,
          shouldIncludeQuiz: true,
          shouldIncludeSaved: {
            userId: authUserId,
          },
          shouldIncludeMarkReadImportant: {
            userId: authUserId,
          },
          shouldIncludeReaction: {
            userId: authUserId,
          },
        },
      });
    });

    it('should throw error when get post by id', async () => {
      const postId = postEntityMock.getId();
      const authUserId = userMock.id;
      jest.spyOn(contentRepository, 'findOne').mockRejectedValue(new Error());
      await expect(domainService.getPostById(postId, authUserId)).rejects.toThrow();
    });

    it('should throw ContentAccessDeniedException when get post by id and post not found', async () => {
      const postId = postEntityMock.getId();
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(postEntityMock);
      jest.spyOn(postEntityMock, 'isOpen').mockReturnValue(false);

      try {
        await domainService.getPostById(postId, null);
      } catch (error) {
        expect(error).toEqual(new ContentAccessDeniedException());
      }
    });
  });
});
