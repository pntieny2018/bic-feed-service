import { createMock } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { groupMock } from '../../../../v2-group/tests/mocks/group.mock';
import {
  IPostDomainService,
  LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
  UpdatePostProps,
} from '../../../domain/domain-service/interface';
import { PostDomainService } from '../../../domain/domain-service/post.domain-service';
import { ContentNotFoundException } from '../../../domain/exception';
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
  let groupAdapter: IGroupAdapter;
  let userAdapter: IUserAdapter;
  let postValidator: IPostValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostDomainService,
        {
          provide: EventBus,
          useFactory: () => jest.fn(),
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
    groupAdapter = module.get<IGroupAdapter>(GROUP_ADAPTER);
    userAdapter = module.get<IUserAdapter>(USER_ADAPTER);
    postValidator = module.get<IPostValidator>(POST_VALIDATOR_TOKEN);
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

  describe('updatePost', () => {
    const updatePostProps: UpdatePostProps = {
      payload: {
        id: postEntityMock.get('id'),
        groupIds: postEntityMock.get('groupIds'),
        content: 'test',
      },
      authUser: userMock,
    };

    it('should update post successfully', async () => {
      jest
        .spyOn(contentRepository, 'findContentByIdInActiveGroup')
        .mockResolvedValue(postEntityMock);
      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValue(groupMock);
      jest.spyOn(userAdapter, 'getUsersByIds').mockResolvedValue([userMock]);
      jest.spyOn(postEntityMock, 'updateAttribute').mockImplementation(jest.fn().mockReturnThis());
      jest
        .spyOn(postEntityMock, 'setPrivacyFromGroups')
        .mockImplementation(jest.fn().mockReturnThis());
      jest.spyOn(postValidator, 'validatePublishContent').mockResolvedValue();

      jest.spyOn(postEntityMock, 'isChanged').mockReturnValue(true);
      jest.spyOn(contentRepository, 'update').mockResolvedValue();

      const result = await domainService.updatePost(updatePostProps);

      expect(result).toEqual(postEntityMock);
    });

    it('should throw error when update post', async () => {
      jest.spyOn(contentRepository, 'findContentByIdInActiveGroup').mockResolvedValue(null);

      try {
        await domainService.updatePost(updatePostProps);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });

    it('should return void when post not changed', async () => {
      jest
        .spyOn(contentRepository, 'findContentByIdInActiveGroup')
        .mockResolvedValue(postEntityMock);
      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValue(groupMock);
      jest.spyOn(userAdapter, 'getUsersByIds').mockResolvedValue([userMock]);
      jest.spyOn(postEntityMock, 'updateAttribute').mockImplementation(jest.fn().mockReturnThis());
      jest
        .spyOn(postEntityMock, 'setPrivacyFromGroups')
        .mockImplementation(jest.fn().mockReturnThis());
      jest.spyOn(postValidator, 'validatePublishContent').mockResolvedValue();

      jest.spyOn(postEntityMock, 'isChanged').mockReturnValue(false);

      const result = await domainService.updatePost(updatePostProps);

      expect(result).toBeUndefined();
    });
  });
});
