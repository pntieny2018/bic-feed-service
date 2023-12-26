import { CONTENT_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';

import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

import {
  GetScheduledContentProps,
  IContentDomainService,
  ScheduledContentPaginationResult,
} from './interface';

export class ContentDomainService implements IContentDomainService {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async getScheduledContent(
    input: GetScheduledContentProps
  ): Promise<ScheduledContentPaginationResult> {
    const { beforeDate } = input;

    const { rows, meta } = await this._contentRepo.getCursorPagination({
      ...input,
      where: {
        status: CONTENT_STATUS.WAITING_SCHEDULE,
        scheduledAt: beforeDate,
      },
      attributes: {
        exclude: ['content'],
      },
    });

    return {
      rows: rows.map((row) => ({
        contentId: row.id,
        ownerId: row.createdBy,
      })),
      meta,
    };
  }
}
