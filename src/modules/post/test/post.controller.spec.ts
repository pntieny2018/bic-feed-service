import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PostController } from '../post.controller';
import { RedisModule } from '@app/redis';
import { mockedCreatePostDto, mockedPostList } from './mocks/post-list';
import { mockedUserAuth } from './mocks/user-auth';

describe('PostController', () => {
  let postService: PostService;
  let postController: PostController;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: {
            createPost: jest.fn(),
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postController = moduleRef.get<PostController>(PostController);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(postService).toBeDefined();
  });

  describe('createPost', () => {
    it('Create post successfully', async () => {
      postService.createPost = jest.fn().mockResolvedValue(true);
      const result = await postService.createPost(mockedUserAuth.id, mockedCreatePostDto);
      expect(postService.createPost).toBeCalledTimes(1);
      expect(postService.createPost).toBeCalledWith(mockedUserAuth.id, mockedCreatePostDto);
      expect(result).toBe(true);
    });
  });

  describe('updatePost', () => {
    it('Update post successfully', async () => {
      postService.updatePost = jest.fn().mockResolvedValue(true);
      const result = await postService.updatePost(1, mockedUserAuth.id, mockedCreatePostDto);
      expect(postService.updatePost).toBeCalledTimes(1);
      expect(postService.updatePost).toBeCalledWith(1, mockedUserAuth.id, mockedCreatePostDto);
      expect(result).toBe(true);
    });
  });

  describe('publishPost', () => {
    it('Publish post successfully', async () => {
      postService.publishPost = jest.fn().mockResolvedValue(true);
      const result = await postService.publishPost(1, mockedUserAuth.id);
      expect(postService.publishPost).toBeCalledTimes(1);
      expect(postService.publishPost).toBeCalledWith(1, mockedUserAuth.id);
      expect(result).toBe(true);
    });
  });
});
