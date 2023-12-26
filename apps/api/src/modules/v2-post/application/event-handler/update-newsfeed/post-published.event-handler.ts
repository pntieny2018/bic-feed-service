import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';
import { PostPublishedEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostPublishedEvent)
export class FeedPostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { entity: postEntity, authUser } = event.payload;

    if (postEntity.isHidden() || !postEntity.isPublished()) {
      return;
    }

    await this._newsfeedDomainService.attachContentIdToUserId(postEntity.getId(), authUser.id);

    await this._newsfeedDomainService.dispatchContentIdToGroups({
      contentId: postEntity.getId(),
      newGroupIds: postEntity.getGroupIds(),
      oldGroupIds: [],
    });
  }
}
