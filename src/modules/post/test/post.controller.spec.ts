import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PostController } from '../post.controller';
import { mockedPostList } from './mocks/post-list.mock';
import { mockedCreatePostDto } from './mocks/create-post.mock';
import { mockedUpdatePostDto } from './mocks/update-post.mock';
import { mockedUserAuth } from './mocks/user-auth.mock';
import { UserDto } from '../../auth';
import { createMock } from '@golevelup/ts-jest';
import { GetPostDto, SearchPostsDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
	
jest.mock('../post.service');
describe('PostController', () => {
  let postService: PostService;
  let postController: PostController;
  const userDto = createMock<UserDto>({
    id: 1,
    username: 'aaaa'
  });
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
            searchPosts: jest.fn()
          },
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
      expect(postService.searchPosts).toBeCalledWith(userDto.id, searchPostsDto);
    });
  });

  describe('getPost', () => {
    it('Get draft post successfully', async () => {
      postService.getDraftPosts = jest.fn().mockResolvedValue(true);
      const getDraftPostsDto: GetDraftPostDto = {
        limit: 1,
        offset: 1
      }
      const result = await postController.getDraftPosts(userDto, getDraftPostsDto);      
      expect(postService.getDraftPosts).toBeCalledTimes(1);
      expect(postService.getDraftPosts).toBeCalledWith(userDto, getDraftPostsDto);
    });
  });

  describe('getPost', () => {
    it('Get post successfully', async () => {
      postService.createPost = jest.fn().mockResolvedValue(true);
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
      postService.createPost = jest.fn().mockResolvedValue(true);
      const result = await postController.createPost(userDto, mockedCreatePostDto);
      expect(postService.createPost).toBeCalledTimes(1);
      expect(postService.createPost).toBeCalledWith(mockedUserAuth.id, mockedCreatePostDto);
      expect(result).toBe(true);
    });
  });

  describe('updatePost', () => {
    it('Update post successfully', async () => {
      postService.updatePost = jest.fn().mockResolvedValue(true);
      const mockedDataUpdatePost = mockedPostList[0];
      const result = await postController.updatePost(userDto, mockedDataUpdatePost.id, mockedUpdatePostDto);
      expect(postService.updatePost).toBeCalledTimes(1);
      expect(postService.updatePost).toBeCalledWith(1, mockedUserAuth.id, mockedUpdatePostDto);
      expect(result).toBe(true);
    });
  });

  describe('publishPost', () => {
    it('Publish post successfully', async () => {
      postService.publishPost = jest.fn().mockResolvedValue(true);
      const mockedDataUpdatePost = mockedPostList[0];
      const result = await postController.publishPost(userDto, mockedDataUpdatePost.id);
      expect(postService.publishPost).toBeCalledTimes(1);
      expect(postService.publishPost).toBeCalledWith(userDto.id, mockedDataUpdatePost.id);
      expect(result).toBe(true);
    });
  });

  describe('deletePost', () => {
    it('Delete post successfully', async () => {
      postService.deletePost = jest.fn().mockResolvedValue(true);
      const mockedDataUpdatePost = mockedPostList[0];
      const result = await postController.deletePost(userDto, mockedDataUpdatePost.id);
      expect(postService.deletePost).toBeCalledTimes(1);
      expect(postService.deletePost).toBeCalledWith(mockedDataUpdatePost.id, userDto.id);
      expect(result).toBe(true);
    });
  });
});
