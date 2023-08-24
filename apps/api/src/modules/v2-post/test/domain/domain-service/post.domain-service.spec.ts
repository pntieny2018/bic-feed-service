import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { IPostDomainService } from '../../../domain/domain-service/interface';
import { LINK_PREVIEW_DOMAIN_SERVICE_TOKEN } from '../../../domain/domain-service/interface/link-preview.domain-service.interface';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/media.domain-service.interface';
import { PostDomainService } from '../../../domain/domain-service/post.domain-service';
import { ArticleEntity } from '../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../../../domain/service-adapter-interface /group-adapter.interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IMentionValidator,
  IPostValidator,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../../../domain/validator/interface';
import { articleEntityMock } from '../../mock/article.entity.mock';

describe('Post domain service', () => {
  let domainService: IPostDomainService;
  let contentRepository: IContentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostDomainService,
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
          provide: USER_APPLICATION_TOKEN,
          useValue: createMock<IUserApplicationService>(),
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
});
