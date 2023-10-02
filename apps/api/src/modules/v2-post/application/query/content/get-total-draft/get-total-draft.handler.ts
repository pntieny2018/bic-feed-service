import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';

import { GetTotalDraftQuery } from './get-total-draft.query';

@QueryHandler(GetTotalDraftQuery)
export class GetTotalDraftHandler implements IQueryHandler<GetTotalDraftQuery, number> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async execute(query: GetTotalDraftQuery): Promise<number> {
    return this._contentRepository.countContentDraft(query.user.id);
  }
}
