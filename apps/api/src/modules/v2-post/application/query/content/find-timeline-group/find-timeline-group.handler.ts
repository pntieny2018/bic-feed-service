import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { FindTimelineGroupDto } from '../../../dto';

import { FindTimelineGroupQuery } from './find-timeline-group.query';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '@api/modules/v2-post/domain/service-adapter-interface';

@QueryHandler(FindTimelineGroupQuery)
export class FindTimelineGroupHandler
  implements IQueryHandler<FindTimelineGroupQuery, FindTimelineGroupDto>
{
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindTimelineGroupQuery): Promise<any> {
    const { authUser, groupId } = query.payload;
    const group = await this._groupAdapter.getGroupById(groupId);
    const groupIds = this._groupAdapter.getGroupIdsAndChildIdsUserJoined(group, authUser.groups);

    const { rows: ids, meta: meta } = await this._contentDomainService.getContentIdsInTimeline({
      ...query.payload,
      groupIds,
      authUserId: authUser.id,
    });

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids,
      authUserId: authUser.id,
    });

    const result = await this._contentBinding.contentsBinding(
      contentEntities,
      query.payload.authUser
    );

    return {
      list: result,
      meta,
    };
  }
}
