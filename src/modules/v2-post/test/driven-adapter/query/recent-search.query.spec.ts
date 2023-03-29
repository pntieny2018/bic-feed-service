import { IRecentSearchFactory, RECENT_SEARCH_FACTORY_TOKEN, RecentSearchFactory } from '../../../domain/factory';
import { RecentSearchModel } from '../../../../../database/models/recent-search.model';
import { getModelToken } from '@nestjs/sequelize';
import { RecentSearchQuery } from '../../../driven-adapter/query';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { userMock } from '../../mock/user.dto.mock';
import { v4 } from 'uuid';

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
        userId: userMock.id
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
  })
});
