import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { createMockUserDto } from 'apps/api/src/modules/v2-post/test/mock/user.mock';
import { v4 } from 'uuid';

import { DeleteRecentSearchHandler } from '../../../aplication/command/delete-recent-search/delete-recent-search.handler';
import {
  IRecentSearchDomainService,
  RECENT_SEARCH_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { RecentSearchDomainService } from '../../../domain/domain-service/recent-search.domain-service';
import { RecentSearchEntity } from '../../../domain/model/recent-search/recent-search.entity';
import { RECENT_SEARCH_REPOSITORY_TOKEN } from '../../../driven-adapter/repository/interface/recent-search.repository.interface';
import { RecentSearchRepository } from '../../../driven-adapter/repository/recent-search.repository';

const userMock = createMockUserDto();

describe('DeleteRecentSearchHandler', () => {
  let handler: DeleteRecentSearchHandler;
  let repo: RecentSearchRepository;
  let domainService: IRecentSearchDomainService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DeleteRecentSearchHandler,
        {
          provide: RECENT_SEARCH_REPOSITORY_TOKEN,
          useValue: createMock<RecentSearchRepository>(),
        },
        {
          provide: RECENT_SEARCH_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<RecentSearchDomainService>(),
        },
      ],
    }).compile();

    handler = moduleRef.get<DeleteRecentSearchHandler>(DeleteRecentSearchHandler);
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
    it('should delete recent search', async () => {
      const payload = {
        id: recentSearchRecord.id,
        userId: userMock.id,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValue(recentSearchEntity);
      const result = await handler.execute({ payload });
      expect(result).toEqual(undefined);
      expect(repo.findOne).toBeCalledWith(payload);
      expect(domainService.deleteRecentSearch).toBeCalledWith(payload);
    });

    it('should not call findone if not have id in payload', async () => {
      const payload = {
        userId: userMock.id,
      };
      const result = await handler.execute({ payload });
      expect(result).toEqual(undefined);
      expect(repo.findOne).not.toBeCalled();
      expect(domainService.deleteRecentSearch).toBeCalledWith(payload);
    });
  });
});
