import { RecentSearchDomainService } from '../../../../v2-post/domain/domain-service';
import { RecentSearchRepository } from '../../../driven-adapter/repository/recent-search.repository';
import {
  CreateRecentSearchHandler
} from '../../../aplication/command/create-recent-search/create-recent-search.handler';
import { Test } from '@nestjs/testing';
import { RECENT_SEARCH_REPOSITORY_TOKEN } from '../../../../v2-post/domain/repositoty-interface';
import { createMock } from '@golevelup/ts-jest';
import { userMock } from '../../../../v2-post/test/mock/user.dto.mock';
import { v4 } from 'uuid';
import { RecentSearchEntity } from '../../../domain/model/recent-search/recent-search.entity';
import { RECENT_SEARCH_DOMAIN_SERVICE_TOKEN } from '../../../domain/domain-service/interface';

describe('CreateRecentSearchHandler', () => {
  let handler: CreateRecentSearchHandler;
  let repo: RecentSearchRepository;
  let domainService: RecentSearchDomainService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateRecentSearchHandler,
        {
          provide: RECENT_SEARCH_REPOSITORY_TOKEN,
          useValue: createMock<RecentSearchRepository>(),
        },
        {
          provide: RECENT_SEARCH_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<RecentSearchDomainService>(),
        }
      ],
    }).compile();

    handler = moduleRef.get<CreateRecentSearchHandler>(CreateRecentSearchHandler);
    repo = moduleRef.get(RECENT_SEARCH_REPOSITORY_TOKEN);
    domainService = moduleRef.get(RECENT_SEARCH_DOMAIN_SERVICE_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  const recentSearchRecord = {
    id: v4(),
    createdBy: userMock.id,
    keyword: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
    target: 'post',
    updatedBy: userMock.id,
    totalSearched: 1,
  };

  const recentSearchEntity = new RecentSearchEntity(recentSearchRecord);

  describe('execute', () => {
    it('should create recent search if record net existed', async () => {
      const payload = {
        target: 'post',
        keyword: 'test',
        userId: userMock.id,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      jest.spyOn(domainService, 'createRecentSearch').mockResolvedValue(recentSearchEntity);
      const result = await handler.execute({ payload });
      expect(result).toEqual({id: recentSearchRecord.id, keyword: recentSearchRecord.keyword});
      expect(domainService.createRecentSearch).toBeCalledWith(payload);
    });

    it('should update recent search if record existed', async () => {
      const payload = {
        target: 'post',
        keyword: 'test',
        userId: userMock.id,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValue(recentSearchEntity);
      jest.spyOn(domainService, 'updateRecentSearch').mockResolvedValue(recentSearchEntity);
      const result = await handler.execute({ payload });
      expect(result).toEqual({id: recentSearchRecord.id, keyword: recentSearchRecord.keyword});
      expect(domainService.updateRecentSearch).toBeCalledWith(recentSearchEntity, {userId: userMock.id});
    });
  });
});
