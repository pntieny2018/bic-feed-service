import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { PageDto } from '../../../../../../common/dto';
import { ContentBinding } from '../../../../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../../application/binding/binding-post/content.interface';
import { ArticleDto } from '../../../../application/dto';
import { GetScheduleArticleHandler } from '../../../../application/query/article/get-schedule-article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { articleDtoMock, articleEntityMock } from '../../../mock/article.entity.mock';
import { userMock } from '../../../mock/user.dto.mock';

describe('GetScheduleArticleHandler', () => {
  let handler: GetScheduleArticleHandler;
  let articleDomainService: IArticleDomainService;
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
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<ContentBinding>(),
        },
      ],
    }).compile();
    handler = module.get(GetScheduleArticleHandler);
    articleDomainService = module.get(ARTICLE_DOMAIN_SERVICE_TOKEN);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('should execute query successfully', async () => {
      jest
        .spyOn(articleDomainService, 'getScheduleArticle')
        .mockResolvedValue([articleEntityMock, articleEntityMock]);
      jest
        .spyOn(contentBinding, 'articleBinding')
        .mockResolvedValue({ ...articleDtoMock, status: CONTENT_STATUS.WAITING_SCHEDULE });
      const result = await handler.execute({
        payload: {
          limit: 1,
          offset: 0,
          order: ORDER.ASC,
          statuses: [CONTENT_STATUS.SCHEDULE_FAILED, CONTENT_STATUS.WAITING_SCHEDULE],
          user: userMock,
        },
      });

      expect(result).toEqual(
        new PageDto<ArticleDto>(
          [{ ...articleDtoMock, status: CONTENT_STATUS.WAITING_SCHEDULE }].map((article) => {
            if (article.status === CONTENT_STATUS.WAITING_SCHEDULE) {
              article.publishedAt = article.scheduledAt;
            }
            return article;
          }),
          {
            limit: 1,
            offset: 0,
            hasNextPage: true,
          }
        )
      );
    });
  });
});
