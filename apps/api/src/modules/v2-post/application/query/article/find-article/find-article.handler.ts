import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../../../../domain/service-adapter-interface /group-adapter.interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { ArticleDto } from '../../../dto';

import { FindArticleQuery } from './find-article.query';

@QueryHandler(FindArticleQuery)
export class FindArticleHandler implements IQueryHandler<FindArticleQuery, ArticleDto> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator
  ) {}

  public async execute(query: FindArticleQuery): Promise<ArticleDto> {
    const { articleId, authUser } = query.payload;
    const articleEntity = await this._articleDomainService.getArticleById(articleId, authUser);
    const groups = await this._groupAdapter.getGroupByIds(articleEntity.get('groupIds'));
    if (authUser) {
      this._postValidator.checkCanReadContent(articleEntity, authUser, groups);
    }
    return this._contentBinding.articleBinding(articleEntity, {
      groups,
      authUser,
    });
  }
}
