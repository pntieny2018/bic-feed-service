import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';
import { PostUpdatedEvent } from '../../../domain/event';
import { CONTENT_STATUS } from '@beincom/constants';

@EventsHandlerAndLog(PostUpdatedEvent)
export class FeedPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity } = event.payload;

    if (postEntity.isHidden()) {
      return;
    }

    const oldPostEntity = postEntity.getSnapshot();
    if (postEntity.isProcessing() && oldPostEntity.status === CONTENT_STATUS.PUBLISHED) {
      await this._newsfeedDomainService.dispatchContentIdToGroups({
        contentId: postEntity.getId(),
        newGroupIds: [],
        oldGroupIds: postEntity.getGroupIds(),
      });
      return;
    }
    if (postEntity.isPublished()) {
      await this._newsfeedDomainService.dispatchContentIdToGroups({
        contentId: postEntity.getId(),
        newGroupIds: postEntity.getGroupIds(),
        oldGroupIds: postEntity.getSnapshot().groupIds,
      });
    }
  }
}
