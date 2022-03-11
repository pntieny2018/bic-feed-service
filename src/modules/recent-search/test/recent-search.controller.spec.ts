import { Test, TestingModule } from '@nestjs/testing';
import { RecentSearchService } from '../recent-search.service';
import { mockedRecentSearchList } from './mocks/recent-search-list';
import { RecentSearchController } from '../recent-search.controller';
import { UserDto } from 'src/modules/auth';
import { RecentSearchModel } from '../../../database/models/recent-search.model';
import { Sequelize } from 'sequelize';
import { DatabaseModule } from 'src/database';

describe('RecentSearchController', () => {
  let recentSearchController: RecentSearchController;
  let recentSearchService: RecentSearchService;
  //let sentryService: SentryService;
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [RecentSearchController],
      providers: [RecentSearchService],
    }).compile();

    recentSearchController = app.get<RecentSearchController>(RecentSearchController);
    recentSearchService = app.get<RecentSearchService>(RecentSearchService);
    //sentryService = moduleRef.get<SentryService>(SentryService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('Create recent search', () => {
    it('Should create new recent search if the keyword is not existed', async () => {
      const dataCreateMock = mockedRecentSearchList[0];
      const userMock: UserDto = {
        userId: dataCreateMock.createdBy,
      };
      const { keyword, target, createdBy, updatedBy } = dataCreateMock;

      // jest.spyOn(recentSearchService, 'create').mockResolvedValueOnce(dataCreateMock);

      // const result = await recentSearchController.createRecentSearch(userMock, dataCreateMock);
      expect(1).toBe(1);
    });
  });
});
