import { CONTENT_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { ArticleEntity } from '../../../../domain/model/content';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { ArticleDto, GetScheduleArticleDto } from '../../../dto';

import { GetScheduleArticleQuery } from './get-schedule-article.query';

@QueryHandler(GetScheduleArticleQuery)
export class GetScheduleArticleHandler
  implements IQueryHandler<GetScheduleArticleQuery, GetScheduleArticleDto>
{
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(query: GetScheduleArticleQuery): Promise<GetScheduleArticleDto> {
    const { user } = query.payload;
    const { rows: ids, meta } = await this._articleDomainService.getArticlesIdsSchedule(
      query.payload
    );

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids,
      authUserId: user.id,
    });
    const articles: ArticleDto[] = [];

    for (const article of contentEntities) {
      articles.push(
        await this._contentBinding.articleBinding(article as ArticleEntity, {
          actor: user,
          authUser: user,
        })
      );
    }

    articles.forEach((article) => {
      if (article.status === CONTENT_STATUS.WAITING_SCHEDULE) {
        article.publishedAt = article.scheduledAt;
      }
    });

    return {
      list: articles,
      meta,
    };
  }
}
