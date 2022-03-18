import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { PostModel } from 'src/database/models/post.model';
import { UserService } from 'src/shared/user';
import { FeedService } from '../feed.service';

describe('FeedService', () => {
  let feedService: FeedService;
  let postModel: typeof PostModel;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getModelToken(PostModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getMany: jest.fn(),
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

  describe('User get timeline', () => {
    describe('User get timeline of a group that user is not a member of', () => {
      it('Should failed', async () => {});
    });

    describe('Get timeline success with order important-post-first and created-at second', () => {
      it('Should get successfully with predefined timeline', async () => {});
    });
  });
});
