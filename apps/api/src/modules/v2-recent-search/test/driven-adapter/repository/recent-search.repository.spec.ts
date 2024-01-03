import { createMock } from '@golevelup/ts-jest';
import { RecentSearchModel } from '@libs/database/postgres/model';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { createMockUserDto } from '../../../../v2-post/test/mock';
import { RecentSearchType } from '../../../data-type/recent-search-type.enum';
import {
  IRecentSearchFactory,
  RECENT_SEARCH_FACTORY_TOKEN,
} from '../../../domain/factory/interface/recent-search.factory.interface';
import { RecentSearchFactory } from '../../../domain/factory/recent-search.factory';
import { RecentSearchEntity } from '../../../domain/model/recent-search/recent-search.entity';
import { RecentSearchRepository } from '../../../driven-adapter/repository/recent-search.repository';

const userMock = createMockUserDto();

describe('RecentSearchRepository', () => {
  let repo, recentSearchModel;
  let factory: IRecentSearchFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecentSearchRepository,
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

    repo = module.get<RecentSearchRepository>(RecentSearchRepository);
    factory = module.get(RECENT_SEARCH_FACTORY_TOKEN);
    recentSearchModel = module.get<RecentSearchModel>(getModelToken(RecentSearchModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const recentSearchRecord = {
    id: v4(),
    keyword: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
    target: RecentSearchType.POST,
    totalSearched: 1,
    createdBy: userMock.id,
    updatedBy: userMock.id,
  };
  const recentSearchEntity = new RecentSearchEntity(recentSearchRecord);

  describe('findOne', () => {
    const findOptions = {
      id: recentSearchRecord.id,
    };
    it('should return recent search entity', async () => {
      recentSearchModel.findOne.mockResolvedValue({ toJSON: () => recentSearchRecord });
      jest.spyOn(factory, 'reconstitute').mockReturnValue(recentSearchEntity);

      const result = await repo.findOne(findOptions);
      expect(result).toEqual(recentSearchEntity);
    });
  });

  describe('create', () => {
    it('should return recent search entity', async () => {
      recentSearchModel.create.mockResolvedValue({ toJSON: () => recentSearchRecord });
      jest.spyOn(factory, 'reconstitute').mockReturnValue(recentSearchEntity);

      const result = await repo.create(recentSearchEntity);
      expect(result).toEqual(undefined);
    });
  });

  describe('update', () => {
    it('should return recent search entity', async () => {
      recentSearchModel.update.mockResolvedValue([1]);
      jest.spyOn(factory, 'reconstitute').mockReturnValue(recentSearchEntity);

      const result = await repo.update(recentSearchEntity);
      expect(result).toEqual(undefined);
    });
  });

  describe('delete', () => {
    it('should return recent search entity', async () => {
      recentSearchModel.destroy.mockResolvedValue(1);

      const result = await repo.delete(recentSearchEntity);
      expect(result).toEqual(undefined);
    });
  });
});
