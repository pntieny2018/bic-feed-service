import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { ArticleDto, GetScheduleContentsResponseDto, PostDto } from '../../../dto';

import { GetScheduleContentQuery } from './get-schedule-content.query';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { ContentAccessDeniedException } from '../../../../domain/exception';

@QueryHandler(GetScheduleContentQuery)
export class GetScheduleContentHandler
  implements IQueryHandler<GetScheduleContentQuery, GetScheduleContentsResponseDto>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(query: GetScheduleContentQuery): Promise<GetScheduleContentsResponseDto> {
    const { user, groupId, isMine, type, order, before, limit, after } = query.payload;

    if (groupId && !isMine) {
      const isAdmin = await this._groupAdapter.isAdminInAnyGroups(user.id, [groupId]);
      if (!isAdmin) {
        throw new ContentAccessDeniedException();
      }
    }

    const { rows: ids, meta } = await this._contentDomainService.getScheduleContentIds({
      type,
      order,
      groupId,
      userId: user.id,
      before,
      limit,
      after,
    });

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids,
      authUserId: user.id,
    });
    const contents = (await this._contentBinding.contentsBinding(contentEntities, user)) as (
      | ArticleDto
      | PostDto
    )[];

    return {
      list: contents,
      meta,
    };
  }
}
