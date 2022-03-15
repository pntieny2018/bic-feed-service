import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { SentryService } from '@app/sentry';

describe('PostService', () => {
  let recentSearchService: PostService;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findOrCreate: jest.fn(),
            count: jest.fn(),
            destroy: jest.fn(),
            changed: jest.fn(),
            set: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    recentSearchService = moduleRef.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(recentSearchService).toBeDefined();
  });
});
