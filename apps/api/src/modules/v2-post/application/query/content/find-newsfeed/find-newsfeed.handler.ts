import { FlowName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../../domain/infra-adapter-interface';
import { ContentBinding, CONTENT_BINDING_TOKEN } from '../../../binding';
import { FindNewsfeedDto } from '../../../dto';

import { FindNewsfeedQuery } from './find-newsfeed.query';

@QueryHandler(FindNewsfeedQuery)
export class FindNewsfeedHandler implements IQueryHandler<FindNewsfeedQuery, FindNewsfeedDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async execute(query: FindNewsfeedQuery): Promise<any> {
    await this._queueAdapter.addPublishRemoveContentToNewsfeedJob({
      contentId: '1',
      newGroupIds: [],
      oldGroupIds: [],
      limit: 1000,
    });
    // const payload = query.payload;
    // const authUserId = payload.authUser.id;
    // const { rows: ids, meta: meta } = await this._contentDomainService.getContentIdsInNewsFeed({
    //   ...payload,
    //   authUserId,
    // });

    // const contentEntities = await this._contentDomainService.getContentByIds({
    //   ids,
    //   authUserId,
    // });
    // const result = await this._contentBinding.contentsBinding(contentEntities, payload.authUser);
    // return {
    //   list: result,
    //   meta,
    // };
  }
}
