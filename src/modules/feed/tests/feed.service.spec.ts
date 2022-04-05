import { getModelToken, SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PostModel } from '../../../database/models/post.model';
import { UserService } from '../../../shared/user/user.service';
import { instanceToPlain } from 'class-transformer';
import {
  mockGetTimeLineDto,
  mockPostModelFindAndCountAll,
  mockUserDto,
  mockUserServiceGetManyResult,
} from './mocks/input.mock';
import { createMock } from '@golevelup/ts-jest';
import { mockGetTimelineOutput } from './mocks/output.mock';

class EPostModel extends PostModel {
  public reactionsCount: string;

  public commentsCount: number;

  public isNowImportant: number;
}

describe('FeedService', () => {
  let feedService: FeedService;
  let postModel: typeof PostModel;
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: UserService,
          useValue: {
            getMany: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
      ],
    }).compile();

    feedService = module.get<FeedService>(FeedService);
    userService = module.get<UserService>(UserService);
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
  });

  it('should be defined', () => {
    expect(feedService).toBeDefined();
    expect(userService).toBeDefined();
    expect(postModel).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User get timeline', () => {
    it('Should get successfully with predefined timeline', async () => {
      const input = createMock<PostModel[]>(mockPostModelFindAndCountAll);
      input.forEach((e) => {
        e.toJSON = () => e;
      });
      const postModelFindAndCountAllSpy = jest
        .spyOn(postModel, 'findAndCountAll')
        .mockResolvedValue({ rows: input, count: [] });
      const userServiceGetManySpy = jest
        .spyOn(userService, 'getMany')
        .mockResolvedValue(mockUserServiceGetManyResult);
      const result = await feedService.getTimeline(mockUserDto.id, mockGetTimeLineDto);
      const rawResult = instanceToPlain(result);
      expect(rawResult).toEqual(mockGetTimelineOutput);
      expect(postModelFindAndCountAllSpy).toBeCalledTimes(1);
      expect(userServiceGetManySpy).toBeCalledTimes(1);
    });

    it('Should not found post', async () => {
      const input = createMock<PostModel[]>([] as PostModel[]);
      const postModelFindAndCountAllSpy = jest
        .spyOn(postModel, 'findAndCountAll')
        .mockResolvedValue({ rows: input, count: [] });
      const userServiceGetManySpy = jest
        .spyOn(userService, 'getMany')
        .mockResolvedValue(mockUserServiceGetManyResult);
      const result = await feedService.getTimeline(mockUserDto.id, mockGetTimeLineDto);
      expect(result.data).toEqual([]);
      expect(postModelFindAndCountAllSpy).toBeCalledTimes(1);
      expect(userServiceGetManySpy).toBeCalledTimes(1);
    });
  });
});
