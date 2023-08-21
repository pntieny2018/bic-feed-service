import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { FindNewsfeedDto } from '../../../dto/newsfeed.dto';

import { FindNewsfeedQuery } from './find-newsfeed.query';

@QueryHandler(FindNewsfeedQuery)
export class FindNewsfeedHandler implements IQueryHandler<FindNewsfeedQuery, FindNewsfeedDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindNewsfeedQuery): Promise<any> {
    const payload = query.payload;
    const authUserId = payload.authUser.id;
    const { rows: ids, meta: meta } = await this._contentDomainService.getContentIdsInNewsFeed({
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
