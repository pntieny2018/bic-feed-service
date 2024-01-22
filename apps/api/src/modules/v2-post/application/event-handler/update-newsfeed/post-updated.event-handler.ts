import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '@api/modules/v2-post/domain/domain-service/interface';
import { CONTENT_STATUS } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostUpdatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostUpdatedEvent)
export class FeedPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { entity: postEntity } = event.payload;

    if (postEntity.isHidden()) {
      return;
    }

    const oldPostEntity = postEntity.getSnapshot();
    if (postEntity.isProcessing() && oldPostEntity.status === CONTENT_STATUS.PUBLISHED) {
      await this._newsfeedDomainService.dispatchContentIdToGroups({
        content: postEntity,
        newGroupIds: [],
        oldGroupIds: postEntity.getGroupIds(),
      });
      return;
    }
    if (postEntity.isPublished()) {
      await this._newsfeedDomainService.dispatchContentIdToGroups({
        content: postEntity,
        newGroupIds: postEntity.getGroupIds(),
        oldGroupIds: postEntity.getSnapshot().groupIds,
      });
    }
  }
}
