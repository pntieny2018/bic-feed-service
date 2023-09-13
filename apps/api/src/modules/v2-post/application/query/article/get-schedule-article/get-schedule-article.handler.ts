import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../../binding/binding-post/content.interface';
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
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: IContentBinding
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
    const articles = (await this._contentBinding.contentsBinding(
      contentEntities,
      user
    )) as ArticleDto[];

    return {
      list: articles,
      meta,
    };
  }
}
