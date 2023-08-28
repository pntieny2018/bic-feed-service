import { CONTENT_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PageDto } from '../../../../../../common/dto';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { ArticleDto } from '../../../dto';

import { GetScheduleArticleQuery } from './get-schedule-article.query';

@QueryHandler(GetScheduleArticleQuery)
export class GetScheduleArticleHandler
  implements IQueryHandler<GetScheduleArticleQuery, PageDto<ArticleDto>>
{
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(query: GetScheduleArticleQuery): Promise<PageDto<ArticleDto>> {
    const { limit, offset, user } = query.payload;
    const result = await this._articleDomainService.getScheduleArticle(query.payload);
    let hasNextPage = false;
    if (result.length > limit) {
      result.pop();
      hasNextPage = true;
    }

    const articles = await Promise.all(
      result.map((article) => {
        return this._contentBinding.articleBinding(article, {
          actor: user,
          authUser: user,
        });
      })
    );

    /**
     * Temporarily set publish to backward compatible with mobile
     */
    articles.forEach((article) => {
      if (article.status === CONTENT_STATUS.WAITING_SCHEDULE) {
        article.publishedAt = article.scheduledAt;
      }
    });

    return new PageDto<ArticleDto>(articles, {
      limit,
      offset,
      hasNextPage,
    });
  }
}
