import { Test, TestingModule } from '@nestjs/testing';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { AuthorityService } from '../../authority';
import { MentionService } from '../../mention';
import { GetPostDto, SearchPostsDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostController } from '../post.controller';
import { PostService } from '../post.service';
import { mockedCreatePostDto } from './mocks/request/create-post.dto.mock';
import { mockedUpdatePostDto } from './mocks/request/update-post.dto.mock';
import { mockedPostData, mockedPostResponse } from './mocks/response/post.response.mock';
import { mockedUserAuth } from './mocks/user.mock';
import { FeedService } from '../../feed/feed.service';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { PostHistoryService } from '../post-history.service';

describe.skip('PostController', () => {
  let postService: PostService;
  let postHistoryService: PostHistoryService;
  let postController: PostController;
  let eventEmitter: InternalEventEmitterService;
  let mentionService: MentionService;
  let authorityService: AuthorityService;
  let feedService: FeedService;
  const userDto = mockedUserAuth;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useClass: jest.fn(),
        },
        {
          provide: PostHistoryService,
          useClass: jest.fn(),
        },
        {
          provide: UserService,
          useClass: jest.fn(),
        },
        {
          provide: GroupService,
          useClass: jest.fn(),
        },
        {
          provide: MentionService,
          useClass: jest.fn(),
        },
        {
          provide: AuthorityService,
          useClass: jest.fn(),
        },
        {
          provide: FeedService,
          useValue: {
            markSeenPosts: jest.fn(),
          },
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postHistoryService = moduleRef.get<PostHistoryService>(PostHistoryService);
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    postController = moduleRef.get<PostController>(PostController);
    eventEmitter = moduleRef.get<InternalEventEmitterService>(InternalEventEmitterService);
    feedService = moduleRef.get<FeedService>(FeedService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getDrafts', () => {
    it('Get draft post successfully', async () => {
      postService.getDrafts = jest.fn().mockResolvedValue(true);
      const getDraftsDto: GetDraftPostDto = {
        limit: 1,
        offset: 1,
      };
      const result = await postController.getDrafts(userDto, getDraftsDto);
      expect(postService.getDrafts).toBeCalledTimes(1);
      expect(postService.getDrafts).toBeCalledWith(userDto.id, getDraftsDto);
    });
  });

  describe('get', () => {
    it('Get post successfully', async () => {
      postService.get = jest.fn().mockResolvedValue(true);
      feedService.markSeenPosts = jest.fn().mockResolvedValue([]);
      const getDto: GetPostDto = {
        commentLimit: 1,
        childCommentLimit: 1,
      };
      const result = await postController.get(
        userDto,
        '8f80cce8-3318-4ce5-8750-275425677a41',
        getDto
      );
      expect(postService.get).toBeCalledTimes(1);
      expect(postService.get).toBeCalledWith(
        '8f80cce8-3318-4ce5-8750-275425677a41',
        userDto,
        getDto
      );
    });
  });

  describe('create', () => {
    it('Create post successfully', async () => {
      postService.create = jest.fn().mockResolvedValue({ id: mockedPostResponse.id });
      postService.get = jest.fn().mockResolvedValue(mockedPostResponse);
      authorityService.checkCanCRUDPost = jest.fn().mockReturnThis();
      const result = await postController.create(userDto, mockedCreatePostDto);
      expect(authorityService.checkCanCRUDPost).toBeCalledTimes(1);
      expect(postService.create).toBeCalledTimes(1);
      expect(postService.create).toBeCalledWith(userDto, mockedCreatePostDto);
      expect(postService.get).toBeCalledTimes(1);
      expect(postService.get).toBeCalledWith(mockedPostResponse.id, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('update', () => {
    it('Update post successfully', async () => {
      authorityService.checkCanCRUDPost = jest.fn().mockReturnThis();
      postService.update = jest.fn().mockResolvedValue(true);
      postService.get = jest.fn().mockResolvedValue(mockedPostResponse);

      const result = await postController.update(
        userDto,
        mockedPostResponse.id,
        mockedUpdatePostDto
      );
      expect(authorityService.checkCanCRUDPost).toBeCalledTimes(1);
      expect(postService.update).toBeCalledTimes(1);
      expect(postService.update).toBeCalledWith(
        mockedPostResponse,
        userDto,
        mockedUpdatePostDto
      );
      expect(postService.get).toBeCalledTimes(2);
      expect(postService.get).toBeCalledWith(mockedPostResponse.id, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('publish', () => {
    it('Publish post successfully', async () => {
      postService.publish = jest.fn().mockResolvedValue(true);
      postService.get = jest.fn().mockResolvedValue(mockedPostResponse);

      const result = await postController.publish(userDto, mockedPostResponse.id);

      expect(postService.publish).toBeCalledTimes(1);
      expect(postService.publish).toBeCalledWith(mockedPostResponse.id, userDto);
      expect(postService.get).toBeCalledTimes(1);
      expect(postService.get).toBeCalledWith(mockedPostResponse.id, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('delete', () => {
    it('Delete post successfully', async () => {
      postService.delete = jest.fn().mockResolvedValue(mockedPostData);

      const result = await postController.delete(userDto, mockedPostData.id);

      expect(postService.delete).toBeCalledTimes(1);
      expect(postService.delete).toBeCalledWith(mockedPostData.id, userDto);
      expect(result).toBe(true);

      // expect(eventEmitter.emit).toBeCalledTimes(1);
      // expect(eventEmitter.emit).toBeCalledWith(
      //   DeletedPostEvent.event,
      //   new DeletedPostEvent(mockedPostDeleted, userDto.profile)
      // );
    });
  });
});
