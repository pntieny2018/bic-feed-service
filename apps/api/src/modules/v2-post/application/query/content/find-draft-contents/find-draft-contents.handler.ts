import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { FindDraftContentsDto } from '../../../dto';

import { FindDraftContentsQuery } from './find-draft-contents.query';

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

    const { rows, meta } = await this._contentDomainService.getDraftContentIdsPagination({
      ...query.payload,
      authUserId: authUser.id,
    });

    if (!rows || rows.length === 0) {
      return new FindDraftContentsDto([], meta);
    }

    const contentEntities = await this._contentDomainService.getDraftContentByIds(rows);

    const contents = await this._contentBinding.contentsBinding(contentEntities, authUser);

    return new FindDraftContentsDto(contents, meta);
  }
}
