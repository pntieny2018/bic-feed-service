import { ContentBinding, CONTENT_BINDING_TOKEN } from '@api/modules/v2-post/application/binding';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '@api/modules/v2-post/domain/service-adapter-interface';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { ArticleDto } from '../../../dto';

import { FindArticleQuery } from './find-article.query';

@QueryHandler(FindArticleQuery)
export class FindArticleHandler implements IQueryHandler<FindArticleQuery, ArticleDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async execute(query: FindArticleQuery): Promise<ArticleDto> {
    const { articleId, authUser } = query.payload;
    const articleEntity = await this._articleDomainService.getArticleById(articleId, authUser);
    const groups = await this._groupAdapter.getGroupsByIds(articleEntity.getGroupIds());
    await this._postValidator.checkCanReadContent(articleEntity, authUser, {
      dataGroups: groups,
    });

    return this._contentBinding.articleBinding(articleEntity, {
      authUser,
      groups,
    });
  }
}
