import { Inject } from '@nestjs/common';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindDraftContentsDto } from './find-draft-contents.dto';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindDraftContentsQuery } from './find-draft-contents.query';
import { FindPostsByIdsQuery } from '../find-posts-by-ids/find-posts-by-ids.query';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';

@QueryHandler(FindDraftContentsQuery)
export class FindDraftContentsHandler
  implements IQueryHandler<FindDraftContentsQuery, FindDraftContentsDto>
{
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindDraftContentsQuery): Promise<FindDraftContentsDto> {
    const { authUser } = query.payload;

    const { rows, meta } = await this._contentDomainService.getDrafts(query.payload);

    if (!rows || rows.length === 0) return new FindDraftContentsDto([], meta);

    const contentIds = rows.map((row) => row.getId());

    const contents = await this._queryBus.execute<
      FindPostsByIdsQuery,
      (PostDto | ArticleDto | SeriesDto)[]
    >(
      new FindPostsByIdsQuery({
        ids: contentIds,
        authUser,
      })
    );

    return new FindDraftContentsDto(contents, meta);
  }
}
