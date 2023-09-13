import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { ContentBinding } from '../../../../application/binding/binding-post/content.binding';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../../../application/binding/binding-post/content.interface';
import { ArticleDto, GetScheduleArticleDto } from '../../../../application/dto';
import { GetScheduleArticleHandler } from '../../../../application/query/article/get-schedule-article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { articleDtoMock, articleEntityMock } from '../../../mock/article.entity.mock';
import { userMock } from '../../../mock/user.dto.mock';

describe('GetScheduleArticleHandler', () => {
  let handler: GetScheduleArticleHandler;
  let articleDomainService: IArticleDomainService;
  let contentDomainService: IContentDomainService;
  let contentBinding: ContentBinding;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleArticleHandler,
        {
          provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IArticleDomainService>(),
        },
        {
          provide: CONTENT_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IContentDomainService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<IContentBinding>(),
        },
      ],
    }).compile();
    handler = module.get(GetScheduleArticleHandler);
    articleDomainService = module.get(ARTICLE_DOMAIN_SERVICE_TOKEN);
    contentDomainService = module.get(CONTENT_DOMAIN_SERVICE_TOKEN);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('should execute query successfully', async () => {
      jest.spyOn(articleDomainService, 'getArticlesIdsSchedule').mockResolvedValue({
        rows: [articleEntityMock.get('id')],
        meta: {
          startCursor:
            'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
          endCursor:
            'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });
      jest.spyOn(contentDomainService, 'getContentByIds').mockResolvedValue([articleEntityMock]);
      jest.spyOn(contentBinding, 'contentsBinding').mockResolvedValue([
        {
          ...articleDtoMock,
          status: CONTENT_STATUS.WAITING_SCHEDULE,
        },
      ] as ArticleDto[]);
      const result = await handler.execute({
        payload: {
          limit: 1,
          order: ORDER.ASC,
          statuses: [CONTENT_STATUS.WAITING_SCHEDULE, CONTENT_STATUS.SCHEDULE_FAILED],
          user: userMock,
        },
      });

      expect(result).toEqual(
        new GetScheduleArticleDto(
          [{ ...articleDtoMock, status: CONTENT_STATUS.WAITING_SCHEDULE }].map((article) => {
            if (article.status === CONTENT_STATUS.WAITING_SCHEDULE) {
              article.publishedAt = article.scheduledAt;
            }
            return article;
          }),
          {
            startCursor:
              'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
            endCursor:
              'eyJzY2hlZHVsZWRBdCI6IjIwMjMtMTItMjlUMTE6MDA6MDAuMDAwWiIsImNyZWF0ZWRBdCI6IjIwMjMtMDYtMjlUMTA6NTA6NTcuOTQ0WiJ9',
            hasNextPage: true,
            hasPreviousPage: false,
          }
        )
      );
    });
  });
});
