import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { createMockUserDto } from '../../../../v2-post/test/mock';
import { FindRecentSearchesPaginationHandler } from '../../../aplication/query/find-recent-searches/find-recent-searches-pagination.handler';
import { RecentSearchEntity } from '../../../domain/model/recent-search/recent-search.entity';
import { RECENT_SEARCH_QUERY_TOKEN } from '../../../driven-adapter/query/interface/recent-search.query.interface';
import { RecentSearchQuery } from '../../../driven-adapter/query/recent-search.query';

const userMock = createMockUserDto();

describe('FindRecentSearchesPaginationHandler', () => {
  let handler, recentSearchQuery;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindRecentSearchesPaginationHandler,
        {
          provide: RECENT_SEARCH_QUERY_TOKEN,
          useValue: createMock<RecentSearchQuery>(),
        },
      ],
    }).compile();
    handler = module.get<FindRecentSearchesPaginationHandler>(FindRecentSearchesPaginationHandler);
    recentSearchQuery = module.get(RECENT_SEARCH_QUERY_TOKEN);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should find recent searches success', async () => {
      const userId = userMock.id;
      const page = 1;
      const limit = 10;
      const recentSearches = [
        {
          id: v4(),
          createdBy: userId,
          updatedBy: userId,
          keyword: 'keyword1',
          createdAt: new Date(),
          updatedAt: new Date(),
          target: 'post',
          totalSearched: 1,
        },
        {
          id: v4(),
          createdBy: userId,
          updatedBy: userId,
          keyword: 'keyword2',
          createdAt: new Date(),
          updatedAt: new Date(),
          target: 'post',
          totalSearched: 1,
        },
      ];
      recentSearchQuery.getPagination.mockResolvedValue({
        rows: recentSearches.map((e) => new RecentSearchEntity(e)),
        total: 2,
      });
      const result = await handler.execute({ userId, page, limit });
      expect(result).toEqual({ rows: recentSearches, total: 2 });
    });
  });
});
