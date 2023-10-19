import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { GetAudienceResponseDto } from '../../../dto';

import { GetContentAudienceQuery } from './get-content-audience.query';

@QueryHandler(GetContentAudienceQuery)
export class GetContentAudienceHandler
  implements IQueryHandler<GetContentAudienceQuery, GetAudienceResponseDto>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: GetContentAudienceQuery): Promise<GetAudienceResponseDto> {
    const audiences = await this._contentDomainService.getAudiences(query.payload);
    return new GetAudienceResponseDto(audiences);
  }
}
