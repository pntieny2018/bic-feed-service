import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindPostsByIdsQuery } from './find-posts-by-ids.query';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';

@QueryHandler(FindPostsByIdsQuery)
export class FindPostsByIdsHandler
  implements IQueryHandler<FindPostsByIdsQuery, (PostDto | ArticleDto | SeriesDto)[]>
{
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindPostsByIdsQuery): Promise<(PostDto | ArticleDto | SeriesDto)[]> {
    const { authUser } = query.payload;
    const contentEntities = await this._contentDomainService.getContentByIds(query.payload);
    const result = await this._contentBinding.contentsBinding(contentEntities, authUser);
    return result;
  }
}
