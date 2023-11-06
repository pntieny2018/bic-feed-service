import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';
import { PostUpdatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostUpdatedEvent)
export class FeedPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity } = event.payload;

    if (postEntity.isHidden() || !postEntity.isPublished()) {
      return;
    }
    await this._newsfeedDomainService.dispatchNewsfeed({
      contentId: postEntity.getId(),
      newGroupIds: postEntity.getGroupIds(),
      oldGroupIds: postEntity.getSnapshot().groupIds,
    });
  }
}
