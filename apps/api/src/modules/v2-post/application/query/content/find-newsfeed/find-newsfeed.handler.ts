import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentBinding, CONTENT_BINDING_TOKEN } from '../../../binding';
import { FindNewsfeedDto } from '../../../dto';

import { FindNewsfeedQuery } from './find-newsfeed.query';
import { uniq } from 'lodash';
import { IUserAdapter, USER_ADAPTER } from '@api/modules/v2-post/domain/service-adapter-interface';

@QueryHandler(FindNewsfeedQuery)
export class FindNewsfeedHandler implements IQueryHandler<FindNewsfeedQuery, FindNewsfeedDto> {
  private readonly _logger = new Logger(FindNewsfeedHandler.name);
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(query: FindNewsfeedQuery): Promise<any> {
    const payload = query.payload;
    const authUserId = payload.authUser.id;
    this._logger.debug('FindNewsfeedHandler 222');
    const { rows: ids, meta: meta } = await this._contentDomainService.getContentIdsInNewsFeed({
      ...payload,
      authUserId,
    });

    const contentEntities = await this._contentDomainService.getContentByIds({
      ids,
      authUserId,
    });
    const users = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      uniq([contentEntities[0].getCreatedBy()]),
      contentEntities[0].getCreatedBy()
    );
    const result = await this._contentBinding.contentsBinding(contentEntities, payload.authUser);
    return {
      list: result,
      meta,
    };
  }
}
