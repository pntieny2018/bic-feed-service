import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { ArticleDto, GetScheduleContentsResponseDto, PostDto } from '../../../dto';

import { GetScheduleContentQuery } from './get-schedule-content.query';

@QueryHandler(GetScheduleContentQuery)
export class GetScheduleContentHandler
  implements IQueryHandler<GetScheduleContentQuery, GetScheduleContentsResponseDto>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(query: GetScheduleContentQuery): Promise<GetScheduleContentsResponseDto> {
    const { user } = query.payload;
    const { rows: ids, meta } = await this._contentDomainService.getScheduleContentIds(
      query.payload
    );

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
