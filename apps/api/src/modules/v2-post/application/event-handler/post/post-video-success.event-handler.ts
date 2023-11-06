import { MEDIA_TYPE } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PostVideoSuccessEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostVideoSuccessEvent)
export class PostVideoSuccessEventHandler implements IEventHandler<PostVideoSuccessEvent> {
  public constructor(
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService
  ) {}

  public async handle(event: PostVideoSuccessEvent): Promise<void> {
    const { videoIds, createdBy } = event;

    if (videoIds.length) {
      await this._mediaDomainService.setMediaUsed(MEDIA_TYPE.VIDEO, videoIds, createdBy);
    }
  }
}
