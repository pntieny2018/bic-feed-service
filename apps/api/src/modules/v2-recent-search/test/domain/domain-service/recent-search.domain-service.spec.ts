import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { createMockUserDto } from 'apps/api/src/modules/v2-post/test/mock/user.mock';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { DatabaseException } from '../../../../../common/exceptions/database.exception';
import { IRecentSearchDomainService } from '../../../domain/domain-service/interface';
import { RecentSearchDomainService } from '../../../domain/domain-service/recent-search.domain-service';
import {
  IRecentSearchFactory,
  RECENT_SEARCH_FACTORY_TOKEN,
} from '../../../domain/factory/interface/recent-search.factory.interface';
import { RecentSearchFactory } from '../../../domain/factory/recent-search.factory';
import { RecentSearchEntity } from '../../../domain/model/recent-search/recent-search.entity';
import {
  IRecentSearchRepository,
  RECENT_SEARCH_REPOSITORY_TOKEN,
} from '../../../driven-adapter/repository/interface/recent-search.repository.interface';
import { RecentSearchRepository } from '../../../driven-adapter/repository/recent-search.repository';

const userMock = createMockUserDto();

describe('RecentSearchDomainService', () => {
  let domainService: IRecentSearchDomainService;
  let recentSearchRepository: IRecentSearchRepository;
  let recentSearchFactory: IRecentSearchFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecentSearchDomainService,
        {
          provide: RECENT_SEARCH_FACTORY_TOKEN,
          useValue: createMock<RecentSearchFactory>(),
        },
        {
          provide: RECENT_SEARCH_REPOSITORY_TOKEN,
          useValue: createMock<RecentSearchRepository>(),
        },
      ],
    }).compile();

    domainService = module.get<IRecentSearchDomainService>(RecentSearchDomainService);
    recentSearchRepository = module.get(RECENT_SEARCH_REPOSITORY_TOKEN);
    recentSearchFactory = module.get(RECENT_SEARCH_FACTORY_TOKEN);
    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const recentSearchRecord = {
    id: v4(),
    createdBy: userMock.id,
    keyword: 'keyword',
    createdAt: new Date(),
    updatedAt: new Date(),
    target: 'post',
    updatedBy: userMock.id,
    totalSearched: 1,
  };

  const recentSearchEntity = new RecentSearchEntity(recentSearchRecord);
  describe('createRecentSearch', () => {
    const input = {
      keyword: 'keyword',
      target: 'post',
      userId: userMock.id,
    };
    it('should create recent search', async () => {
      jest.spyOn(recentSearchFactory, 'create').mockReturnValue(recentSearchEntity);
      jest.spyOn(recentSearchRepository, 'create').mockResolvedValue(undefined);
      const result = await domainService.createRecentSearch(input);
      expect(result).toEqual(recentSearchEntity);
    });

    it('should throw error DatabaseException when create recent search fail', async () => {
      jest.spyOn(recentSearchFactory, 'create').mockReturnValue(recentSearchEntity);
      jest.spyOn(recentSearchRepository, 'create').mockRejectedValue(new Error());
      try {
        await domainService.createRecentSearch(input);
      } catch (e) {
        expect(e).toEqual(new DatabaseException());
      }
    });
  });

  describe('updateRecentSearch', () => {
    const input = {
      keyword: 'keyword',
      target: 'post',
      userId: userMock.id,
    };
    it('should update recent search', async () => {
      jest.spyOn(recentSearchRepository, 'findOne').mockResolvedValue(recentSearchEntity);
      jest.spyOn(recentSearchRepository, 'update').mockResolvedValue(undefined);
      const result = await domainService.updateRecentSearch(recentSearchEntity, input);
      expect(result.get('totalSearched')).toEqual(2);
    });

    it('should throw error DatabaseException when update recent search fail', async () => {
      jest.spyOn(recentSearchRepository, 'findOne').mockResolvedValue(recentSearchEntity);
      jest.spyOn(recentSearchRepository, 'update').mockRejectedValue(new Error());
      try {
        await domainService.updateRecentSearch(recentSearchEntity, input);
      } catch (e) {
        expect(e).toEqual(new DatabaseException());
      }
    });
  });

  describe('deleteRecentSearch', () => {
    const input = {
      id: recentSearchRecord.id,
    };
    it('should delete recent search', async () => {
      jest.spyOn(recentSearchRepository, 'delete').mockResolvedValue(undefined);
      const result = await domainService.deleteRecentSearch(input);
      expect(result).toEqual(undefined);
    });

    it('should throw error DatabaseException when delete recent search fail', async () => {
      jest.spyOn(recentSearchRepository, 'delete').mockRejectedValue(new Error());
      try {
        await domainService.deleteRecentSearch(input);
      } catch (e) {
        expect(e).toEqual(new DatabaseException());
      }
    });
  });
});
