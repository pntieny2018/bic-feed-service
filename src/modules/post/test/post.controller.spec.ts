import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PostController } from '../post.controller';
import { RedisModule } from '@app/redis';
import { mockedCreatePost } from './mocks/post-list';
import { mockedUserAuth } from './mocks/user-auth';
import { HttpException } from '@nestjs/common';

describe('PostController', () => {
  let postService: PostService;
  let postController: PostController;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        RedisModule,
      ],
      controllers: [
        PostController,
      ],
      providers: [
        {
          provide: PostService, 
          useValue: {
            createPost: jest.fn()
          }
        }
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
      const result = await postService.createPost(mockedUserAuth, mockedCreatePost);
      expect(postService.createPost).toBeCalledTimes(1);
      expect(postService.createPost).toBeCalledWith(mockedUserAuth, mockedCreatePost);
      expect(result).toBe(true); 
    });
  });
});