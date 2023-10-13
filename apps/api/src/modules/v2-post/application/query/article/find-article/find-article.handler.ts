import { Inject } from '@nestjs/common';
import { EventBus, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentHasSeenEvent } from '../../../../domain/event';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { ArticleDto } from '../../../dto';

import { FindArticleQuery } from './find-article.query';

@QueryHandler(FindArticleQuery)
export class FindArticleHandler implements IQueryHandler<FindArticleQuery, ArticleDto> {
  public constructor(
    private readonly _event: EventBus,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService
  ) {}

  public async execute(query: FindArticleQuery): Promise<ArticleDto> {
    const { articleId, authUser } = query.payload;
    const articleEntity = await this._articleDomainService.getArticleById(articleId, authUser);
    const groups = await this._groupAdapter.getGroupsByIds(articleEntity.get('groupIds'));

    await this._postValidator.checkCanReadContent(articleEntity, authUser, groups);
    if (articleEntity.isPublished()) {
      this._event.publish(new ContentHasSeenEvent({ contentId: articleId, userId: authUser.id }));
    }

    return this._contentBinding.articleBinding(articleEntity, {
      groups,
      authUser,
    });
  }
}
