import { IEvent } from '../../common/interfaces';
import { PostUpdateCacheGroupEventPayload } from './payload/post-update-cache-group-event.payload';
import { PostUpdatedCacheGroup } from '../../common/constants';

export class PostUpdateCacheGroupEvent implements IEvent<PostUpdateCacheGroupEventPayload> {
  protected static event = PostUpdatedCacheGroup;

  public payload: PostUpdateCacheGroupEventPayload;

  public constructor(payload: PostUpdateCacheGroupEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return PostUpdateCacheGroupEvent.event;
  }
}
