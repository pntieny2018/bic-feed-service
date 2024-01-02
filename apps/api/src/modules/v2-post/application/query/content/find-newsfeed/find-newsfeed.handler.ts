import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentBinding, CONTENT_BINDING_TOKEN } from '../../../binding';
import { FindNewsfeedDto } from '../../../dto';

import { FindNewsfeedQuery } from './find-newsfeed.query';

@QueryHandler(FindNewsfeedQuery)
export class FindNewsfeedHandler implements IQueryHandler<FindNewsfeedQuery, FindNewsfeedDto> {
  private readonly _logger = new Logger(FindNewsfeedHandler.name);
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,

    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async execute(query: FindNewsfeedQuery): Promise<any> {
    const payload = query.payload;
    const authUserId = payload.authUser.id;
    const { rows: ids, meta: meta } = await this._newsfeedDomainService.getContentIdsInNewsFeed({
      ...payload,
      authUserId,
    });
    const contentEntities = await this._contentDomainService.getContentByIds({
      ids,
      authUserId,
    });
    const result = await this._contentBinding.contentsBinding(contentEntities, payload.authUser);
    return {
      list: result,
      meta,
    };
  }
}
