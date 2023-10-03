import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { ArticleDto, PostDto, SeriesDto } from '../../../dto';

import { FindPinnedContentQuery } from './find-pinned-content.query';

@QueryHandler(FindPinnedContentQuery)
export class FindPinnedContentHandler implements IQueryHandler<FindPinnedContentQuery> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(
    query: FindPinnedContentQuery
  ): Promise<(ArticleDto | PostDto | SeriesDto)[]> {
    const { authUser, groupId } = query.payload;
    const contents = await this._contentDomain.findPinnedOrder(groupId, authUser.id);
    return this._contentBinding.contentsBinding(contents, authUser);
  }
}
