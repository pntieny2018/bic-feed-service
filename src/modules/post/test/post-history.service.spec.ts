import { RedisModule } from '@app/redis';
import { ClientsModule } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PostEditedHistoryModel } from '../../../database/models/post-edited-history.model';
import { AuthorityService } from '../../authority';
import { PostHistoryService } from '../post-history.service';
import { PostService } from '../post.service';
import { mockIPost, mockPostEditedHistoryModelArr } from './mocks/input.mock';
import { mockGetPostEditedHistoryDto } from './mocks/request/get-post-edited-history.dto.mock';
import { mockedUserAuth } from './mocks/user.mock';



describe.skip('PostHistoryService', () => {
  let postService: PostService;
  let postHistoryService: PostHistoryService;
  let authorityService: AuthorityService;
  let postEditedHistoryModelMock: typeof PostEditedHistoryModel;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, ClientsModule],
      providers: [
        PostService,
        PostHistoryService,
        AuthorityService,
        {
          provide: getModelToken(PostEditedHistoryModel),
          useValue: {
            findAndCountAll: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postHistoryService = moduleRef.get<PostHistoryService>(PostHistoryService);
    postEditedHistoryModelMock = moduleRef.get<typeof PostEditedHistoryModel>(
      getModelToken(PostEditedHistoryModel)
    );
    authorityService = moduleRef.get<AuthorityService>(AuthorityService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(postHistoryService).toBeDefined();
  });

  describe('getPostEditedHistory', () => {
    it('Should successfully', async () => {
      postService.findPost = jest.fn().mockResolvedValue(mockIPost);

      authorityService.checkPostOwner = jest.fn().mockResolvedValue(Promise.resolve());

      postEditedHistoryModelMock.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockPostEditedHistoryModelArr,
        count: mockPostEditedHistoryModelArr.length,
      });

      await postHistoryService.getEditedHistory(mockedUserAuth, mockIPost.id, mockGetPostEditedHistoryDto);

      expect(authorityService.checkPostOwner).toBeCalledTimes(1);
      expect(postService.findPost).toBeCalledTimes(1);
    });

    it('User not in post groups', async () => {
      postService.findPost = jest.fn().mockResolvedValue(mockIPost);
      postEditedHistoryModelMock.findAndCountAll = jest
        .fn()
        .mockResolvedValue({ rows: [], count: 0 });

      try {
        await postHistoryService.getEditedHistory(
          mockedUserAuth,
          mockIPost.id,
          mockGetPostEditedHistoryDto
        );
      } catch (e) {
        expect(e.message).toEqual(HTTP_STATUS_ID.API_FORBIDDEN);
      }

      expect(postService.findPost).toBeCalledTimes(1);
    });
  });
});
