import { ArticleHasBeenPublished } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { ArticleHasBeenPublishedEventPayload } from './payload';

export class ArticleHasBeenPublishedEvent implements IEvent<ArticleHasBeenPublishedEventPayload> {
  protected static event = ArticleHasBeenPublished;

  public payload: ArticleHasBeenPublishedEventPayload;

  public constructor(payload: ArticleHasBeenPublishedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return ArticleHasBeenPublishedEvent.event;
  }
}
