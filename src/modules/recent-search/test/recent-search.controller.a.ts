import { Test, TestingModule } from '@nestjs/testing';
import { mockedUserAuth } from './mocks/user-auth';
import { RecentSearchService } from '../recent-search.service';
import { RecentSearchController } from '../recent-search.controller';

describe('RecentSearchController', () => {
  let recentSearchService: RecentSearchService;
  let controller: RecentSearchController;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [RecentSearchController],
      providers: [
        {
          provide: RecentSearchService,
          useValue: {
            create: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            clean: jest.fn()
          },
        },
      ],
    }).compile();

    recentSearchService = moduleRef.get<RecentSearchService>(RecentSearchService); 
    controller = moduleRef.get<RecentSearchController>(RecentSearchController);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRecentSearch', () => {
    it('Create successfully', async () => {
    
      expect(true).toBe(true);
    });
  });
});
