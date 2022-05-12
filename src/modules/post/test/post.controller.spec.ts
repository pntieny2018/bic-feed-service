import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PostController } from '../post.controller';
import { mockedPostList } from './mocks/data/post-list.mock';
import { mockedCreatePostDto } from './mocks/request/create-post.dto.mock';
import { mockedUpdatePostDto } from './mocks/request/update-post.mock';
import { mockedUserAuth } from './mocks/data/user-auth.mock';
import { GetPostDto, SearchPostsDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { mockedPostResponse } from './mocks/response/post.response.mock';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
	
jest.mock('../post.service');
describe('PostController', () => {
  let postService: PostService;
  let postController: PostController;
  let eventEmitter: InternalEventEmitterService;
  const userDto = mockedUserAuth;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: {
            createPost: jest.fn(),
            updatePost: jest.fn(),
            deletePost: jest.fn(), 
            publishPost: jest.fn(), 
            getPost: jest.fn(),
            getDraftPosts: jest.fn(),
            searchPosts: jest.fn(),
            checkPostOwner: jest.fn(),
          },
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn().mockResolvedValue({}),
          },
        },
        
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postController = moduleRef.get<PostController>(PostController);
    eventEmitter = moduleRef.get<InternalEventEmitterService>(InternalEventEmitterService);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(postController).toBeDefined();
  });

  describe('searchPosts', () => {
    it('Should call searchPosts', async () => {
      postService.searchPosts = jest.fn().mockResolvedValue(true);
      const searchPostsDto: SearchPostsDto = {
        content: 'a'
      }
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
        offset: 1
      }
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
        childCommentLimit: 1
      }
      const result = await postController.getPost(userDto, 1, getPostDto);      
      expect(postService.getPost).toBeCalledTimes(1);
      expect(postService.getPost).toBeCalledWith(1, userDto, getPostDto);
    });
  });

  describe('createPost', () => {
    it('Create post successfully', async () => {
      postService.createPost = jest.fn().mockResolvedValue({ id: mockedPostResponse.id });
      postService.getPost = jest.fn().mockResolvedValue(mockedPostResponse);
      const result = await postController.createPost(userDto, mockedCreatePostDto);
      expect(postService.createPost).toBeCalledTimes(1);
      expect(postService.createPost).toBeCalledWith(userDto, mockedCreatePostDto);
      expect(postService.getPost).toBeCalledTimes(1);
      expect(postService.getPost).toBeCalledWith(mockedPostResponse.id, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('updatePost', () => {
    it('Update post successfully', async () => {
      postService.updatePost = jest.fn().mockResolvedValue(true);
      postService.getPost = jest.fn().mockResolvedValue(mockedPostResponse);
      const mockedDataUpdatePost = mockedPostList[0];
      const result = await postController.updatePost(userDto, mockedDataUpdatePost.id, mockedUpdatePostDto);
      expect(postService.updatePost).toBeCalledTimes(1);
      expect(postService.checkPostOwner).toBeCalledTimes(1);
      expect(postService.updatePost).toBeCalledWith(mockedDataUpdatePost.id, userDto, mockedUpdatePostDto);
      expect(postService.getPost).toBeCalledTimes(2);
      expect(postService.getPost).toBeCalledWith(1, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);

    });
  });

  describe('publishPost', () => {
    it('Publish post successfully', async () => {
      postService.publishPost = jest.fn().mockResolvedValue(true);
      postService.getPost = jest.fn().mockResolvedValue(mockedPostResponse);
      const result = await postController.publishPost(userDto, 1);
      expect(postService.publishPost).toBeCalledTimes(1);
      expect(postService.publishPost).toBeCalledWith(1, userDto.id);
      expect(postService.getPost).toBeCalledTimes(1);
      expect(postService.getPost).toBeCalledWith(1, userDto, new GetPostDto());
      expect(result).toBe(mockedPostResponse);
    });
  });

  describe('deletePost', () => {
    it('Delete post successfully', async () => {
      const mockedPostDeleted = mockedPostList[0];
      postService.deletePost = jest.fn().mockResolvedValue(mockedPostDeleted);
      const result = await postController.deletePost(userDto, mockedPostDeleted.id);
      expect(postService.deletePost).toBeCalledTimes(1);
      expect(postService.deletePost).toBeCalledWith(mockedPostDeleted.id, userDto.id);
      expect(result).toBe(true);

      // expect(eventEmitter.emit).toBeCalledTimes(1);
      // expect(eventEmitter.emit).toBeCalledWith(
      //   DeletedPostEvent.event,
      //   new DeletedPostEvent(mockedPostDeleted, userDto.profile)
      // );
    });
  });
});
