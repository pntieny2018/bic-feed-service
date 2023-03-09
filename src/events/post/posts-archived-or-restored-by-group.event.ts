import { IEvent } from '../../common/interfaces';
import { PostsArchivedOrRestoredByGroupEventPayload } from './payload/posts-archived-or-restored-by-group-event.payload';
import { PostsArchivedOrRestoredByGroup } from '../../common/constants';

export class PostsArchivedOrRestoredByGroupEvent
  implements IEvent<PostsArchivedOrRestoredByGroupEventPayload>
{
  protected static event = PostsArchivedOrRestoredByGroup;

  public payload: PostsArchivedOrRestoredByGroupEventPayload;

  public constructor(payload: PostsArchivedOrRestoredByGroupEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return PostsArchivedOrRestoredByGroupEvent.event;
  }
}
