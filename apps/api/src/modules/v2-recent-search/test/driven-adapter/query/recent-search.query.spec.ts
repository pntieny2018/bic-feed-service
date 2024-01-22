import { createMock } from '@golevelup/ts-jest';
import { RecentSearchModel } from '@libs/database/postgres/model';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { createMockUserDto } from '../../../../v2-post/test/mock';
import {
  IRecentSearchFactory,
  RECENT_SEARCH_FACTORY_TOKEN,
} from '../../../domain/factory/interface/recent-search.factory.interface';
import { RecentSearchFactory } from '../../../domain/factory/recent-search.factory';
import { RecentSearchQuery } from '../../../driven-adapter/query/recent-search.query';

const userMock = createMockUserDto();

describe('RecentSearchQuery', () => {
  let query, recentSearchModel;
  let factory: IRecentSearchFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecentSearchQuery,
        {
          provide: RECENT_SEARCH_FACTORY_TOKEN,
          useValue: createMock<RecentSearchFactory>(),
        },
        {
          provide: getModelToken(RecentSearchModel),
          useValue: createMock<RecentSearchModel>(),
        },
      ],
    }).compile();

    query = module.get<RecentSearchQuery>(RecentSearchQuery);
    factory = module.get(RECENT_SEARCH_FACTORY_TOKEN);
    recentSearchModel = module.get<RecentSearchModel>(getModelToken(RecentSearchModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPagination', () => {
    const recentSearchMock = {
      id: v4(),
      keyword: 'keyword',
      target: 'post',
      createdBy: userMock.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    it('should return pagination success', async () => {
      const input = {
        limit: 10,
        offset: 0,
        order: 'DESC',
        userId: userMock.id,
      };
      recentSearchModel.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [recentSearchMock],
        count: 1,
      });
      factory.reconstitute = jest.fn().mockReturnValue(recentSearchMock);
      const result = await query.getPagination(input);
      expect(result).toEqual({
        rows: [recentSearchMock],
        total: 1,
      });
    });
  });
});
