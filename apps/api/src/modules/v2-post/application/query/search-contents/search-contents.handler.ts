import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchContentsQuery } from './search-contents.query';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { SearchService } from '../../../../search/search.service';

@QueryHandler(SearchContentsQuery)
export class SearchContentsHandler implements IQueryHandler<SearchContentsQuery, void> {
  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: SearchContentsQuery): Promise<void> {
    const { authUser, groupId, contentTypes } = query.payload;

    let groupIds: string[] = authUser.groups;

    if (groupId) {
      const group = await this._groupAppService.findOne(groupId);
      groupIds = this._groupAppService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
    }

    const excludeByIds = await this._contentDomainService.getReportedContentIdsByUser(
      authUser.id,
      contentTypes
    );

    // await this._postSearchService.searchContent({ ...query.payload, groupIds, excludeByIds });
  }
}
