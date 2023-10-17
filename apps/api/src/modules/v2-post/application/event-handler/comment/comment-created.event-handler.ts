import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { CommentCreatedEvent } from '../../../domain/event/comment.event';

@EventsHandlerAndLog(CommentCreatedEvent)
export class CommentCreatedEventHandler implements IEventHandler<CommentCreatedEvent> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService
  ) {}

  public async handle(event: CommentCreatedEvent): Promise<void> {
    const { payload } = event;

    await this._contentDomain.markSeen(payload.comment.get('postId'), payload.user.id);
  }
}
