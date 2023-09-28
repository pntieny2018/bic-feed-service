import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';

import { GetTotalDraftQuery } from './get-total-draft.query';

@QueryHandler(GetTotalDraftQuery)
export class GetTotalDraftHandler implements IQueryHandler<GetTotalDraftQuery, number> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: GetTotalDraftQuery): Promise<number> {
    return this._contentDomainService.getTotalDraft(query.user.id);
  }
}
