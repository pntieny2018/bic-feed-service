import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { EntityHelper } from '../../../../../common/helpers';
import { ReactionCreatedEvent, ReportCreatedEvent } from '../../../domain/event';
import { ReportEntity } from '../../../domain/model/report';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';

@EventsHandlerAndLog(ReactionCreatedEvent)
export class SeenContentWhenReactionCreatedEventHandler
  implements IEventHandler<ReactionCreatedEvent>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async handle(event: ReactionCreatedEvent): Promise<void> {
    const { reactionEntity } = event.payload;
    if (reactionEntity.get('target') !== CONTENT_TARGET.COMMENT) {
      await this._contentDomainService.markSeen(
        reactionEntity.get('targetId'),
        reactionEntity.get('createdBy')
      );
    }
  }
}
