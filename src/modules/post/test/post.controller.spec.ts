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

describe('PostController', () => {
  let postService: PostService;
  let postController: PostController;
  let eventEmitter: InternalEventEmitterService;
  let mentionService: MentionService;
  let authorityService: AuthorityService;
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
          provide: MentionService,
          useClass: jest.fn(),
        },
        {
          provide: AuthorityService,
          useClass: jest.fn(),
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
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    postController = moduleRef.get<PostController>(PostController);
    eventEmitter = moduleRef.get<InternalEventEmitterService>(InternalEventEmitterService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('searchPosts', () => {
    it('Should call searchPosts', async () => {
      postService.searchPosts = jest.fn().mockResolvedValue(true);
      const searchPostsDto: SearchPostsDto = {
        content: 'a',
      };
      const result = await postController.searchPosts(userDto, searchPostsDto);
      expect(postService.searchPosts).toBeCalledTimes(1);
      expect(postService.searchPosts).toBeCalledWith(userDto, searchPostsDto);
    });
  });

  describe('getDraftPosts', () => {
    it('Get draft post successfully', async () => {
      postService.getDraftPosts = jest.fn().mockResolvedValue(true);
      const getDraftPostsDto: GetDraftPostDto = {
        limit: 1,
        offset: 1,
      };
      const result = await postController.getDraftPosts(userDto, getDraftPostsDto);
      expect(postService.getDraftPosts).toBeCalledTimes(1);
      expect(postService.getDraftPosts).toBeCalledWith(userDto.id, getDraftPostsDto);
    });
  });

  describe('getPost', () => {
    it('Get post successfully', async () => {
      postService.getPost = jest.fn().mockResolvedValue(true);
      const getPostDto: GetPostDto = {
        commentLimit: 1,
        childCommentLimit: 1,
      };
      const result = await postController.getPost(
        userDto,
        '8f80cce8-3318-4ce5-8750-275425677a41',
        getPostDto
      );
      expect(postService.getPost).toBeCalledTimes(1);
      expect(postService.getPost).toBeCalledWith(
        '8f80cce8-3318-4ce5-8750-275425677a41',
        userDto,
        getPostDto
      );
    });
  });

  describe('createPost', () => {
    it('Create post successfully', async () => {
      postService.createPost = jest.fn().mockResolvedValue({ id: mockedPostResponse.id });
      postService.getPost = jest.fn().mockResolvedValue(mockedPostResponse);
      authorityService.checkCanCreatePost = jest.fn().mockReturnThis();
      const result = await postController.createPost(userDto, mockedCreatePostDto);
      expect(authorityService.checkCanCreatePost).toBeCalledTimes(1);
      expect(postService.createPost).toBeCalledTimes(1);
      expect(postService.createPost).toBeCalledWith(userDto, mockedCreatePostDto);
      expect(postService.getPost).toBeCalledTimes(1);
      expect(postService.getPost).toBeCalledWith(mockedPostResponse.id, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('updatePost', () => {
    it('Update post successfully', async () => {
      authorityService.checkCanUpdatePost = jest.fn().mockReturnThis();
      authorityService.checkCanCreatePost = jest.fn().mockReturnThis();
      authorityService.checkCanDeletePost = jest.fn().mockReturnThis();
      postService.updatePost = jest.fn().mockResolvedValue(true);
      postService.getPost = jest.fn().mockResolvedValue(mockedPostResponse);

      const result = await postController.updatePost(
        userDto,
        mockedPostResponse.id,
        mockedUpdatePostDto
      );
      expect(authorityService.checkCanUpdatePost).toBeCalledTimes(1);
      expect(authorityService.checkCanCreatePost).toBeCalledTimes(1);
      expect(postService.updatePost).toBeCalledTimes(1);
      expect(postService.updatePost).toBeCalledWith(
        mockedPostResponse,
        userDto,
        mockedUpdatePostDto
      );
      expect(postService.getPost).toBeCalledTimes(2);
      expect(postService.getPost).toBeCalledWith(mockedPostResponse.id, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('publishPost', () => {
    it('Publish post successfully', async () => {
      postService.publishPost = jest.fn().mockResolvedValue(true);
      postService.getPost = jest.fn().mockResolvedValue(mockedPostResponse);

      const result = await postController.publishPost(userDto, mockedPostResponse.id);

      expect(postService.publishPost).toBeCalledTimes(1);
      expect(postService.publishPost).toBeCalledWith(mockedPostResponse.id, userDto);
      expect(postService.getPost).toBeCalledTimes(1);
      expect(postService.getPost).toBeCalledWith(mockedPostResponse.id, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('deletePost', () => {
    it('Delete post successfully', async () => {
      postService.deletePost = jest.fn().mockResolvedValue(mockedPostData);

      const result = await postController.deletePost(userDto, mockedPostData.id);

      expect(postService.deletePost).toBeCalledTimes(1);
      expect(postService.deletePost).toBeCalledWith(mockedPostData.id, userDto);
      expect(result).toBe(true);

      // expect(eventEmitter.emit).toBeCalledTimes(1);
      // expect(eventEmitter.emit).toBeCalledWith(
      //   DeletedPostEvent.event,
      //   new DeletedPostEvent(mockedPostDeleted, userDto.profile)
      // );
    });
  });
});
