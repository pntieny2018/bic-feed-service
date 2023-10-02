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
  PublishPostProps,
} from '../../../domain/domain-service/interface';
import { PostDomainService } from '../../../domain/domain-service/post.domain-service';
import { ContentNotFoundException, ContentAccessDeniedException } from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
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
import { createMockArticleEntity, createMockPostEntity, createMockUserDto } from '../../mock';

describe('Post domain service', () => {
  let domainService: IPostDomainService;
  let contentRepository: IContentRepository;
  let groupAdapter: IGroupAdapter;
  let userAdapter: IUserAdapter;
  let postValidator: IPostValidator;
  let mentionValidator: IMentionValidator;
  let contentValidator: IContentValidator;

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
    mentionValidator = module.get<IMentionValidator>(MENTION_VALIDATOR_TOKEN);
    contentValidator = module.get<IContentValidator>(CONTENT_VALIDATOR_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishPost', () => {
    const userMock = createMockUserDto();
    const postEntityMock = createMockPostEntity();

    const props: PublishPostProps = {
      payload: {
        groupIds: postEntityMock.getGroupIds(),
        id: postEntityMock.getId(),
      },
      actor: userMock,
    };

    it('should publish post successfully', async () => {
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(postEntityMock);
      jest.spyOn(postEntityMock, 'isPublished').mockReturnValue(false);
      jest.spyOn(postEntityMock, 'setPublish').mockImplementation(jest.fn());

      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValue(groupMock);
      jest.spyOn(userAdapter, 'getUsersByIds').mockResolvedValue([userMock]);
      jest.spyOn(postValidator, 'validatePublishContent').mockImplementation(jest.fn());
      jest.spyOn(mentionValidator, 'validateMentionUsers').mockImplementation(jest.fn());
      jest.spyOn(contentValidator, 'validateSeriesAndTags').mockImplementation(jest.fn());

      jest.spyOn(postEntityMock, 'isPublished').mockReturnValue(false);

      const result = await domainService.publish(props);
      expect(result).toEqual(postEntityMock);
      expect(postEntityMock.setPublish).toBeCalledTimes(1);
    });

    it('should throw error ContentNotFoundException when content is not post', async () => {
      const articleEntityMock = createMockArticleEntity();
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(articleEntityMock);

      try {
        await domainService.publish(props);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });
  });

  describe('updatePost', () => {
    const userMock = createMockUserDto();
    const postEntityMock = createMockPostEntity();

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

  describe('createDraftPost', () => {
    const userMock = createMockUserDto();
    const postEntityMock = createMockPostEntity();

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
    const userMock = createMockUserDto();
    const postEntityMock = createMockPostEntity();

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
