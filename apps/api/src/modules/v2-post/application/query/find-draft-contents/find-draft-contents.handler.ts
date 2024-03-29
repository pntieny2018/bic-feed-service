import { Inject } from '@nestjs/common';
import { FindDraftContentsDto } from './find-draft-contents.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDraftContentsQuery } from './find-draft-contents.query';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';

@QueryHandler(FindDraftContentsQuery)
export class FindDraftContentsHandler
  implements IQueryHandler<FindDraftContentsQuery, FindDraftContentsDto>
{
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindDraftContentsQuery): Promise<FindDraftContentsDto> {
    const { authUser } = query.payload;

    const { rows, meta } = await this._contentDomainService.getDraftsPagination(query.payload);

    if (!rows || rows.length === 0) return new FindDraftContentsDto([], meta);

    const contentIds = rows.map((row) => row.getId());

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids: contentIds,
      authUser,
    });

    const contents = await this._contentBinding.contentsBinding(contentEntities, authUser);

    return new FindDraftContentsDto(contents, meta);
  }
}
