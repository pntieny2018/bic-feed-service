import { ArticleHasBeenUpdated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { ArticleHasBeenUpdatedEventPayload } from './payload';

export class ArticleHasBeenUpdatedEvent implements IEvent<ArticleHasBeenUpdatedEventPayload> {
  protected static event = ArticleHasBeenUpdated;

  public payload: ArticleHasBeenUpdatedEventPayload;

  public constructor(payload: ArticleHasBeenUpdatedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return ArticleHasBeenUpdatedEvent.event;
  }
}
