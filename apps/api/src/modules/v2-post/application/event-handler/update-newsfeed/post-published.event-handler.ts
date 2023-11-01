import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';
import { PostPublishedEvent } from '../../../domain/event';
import { Inject } from '@nestjs/common';
import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';

@EventsHandlerAndLog(PostPublishedEvent)
export class FeedPostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity } = event.payload;

    if (postEntity.isHidden() || !postEntity.isPublished()) {
      return;
    }
    await this._newsfeedDomainService.dispatchNewsfeed({
      contentId: postEntity.getId(),
      newGroupIds: postEntity.getGroupIds(),
      oldGroupIds: [],
    });
  }
}
