import { ArticleHasBeenDeleted } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { ArticleHasBeenDeletedEventPayload } from './payload';

export class ArticleHasBeenDeletedEvent implements IEvent<ArticleHasBeenDeletedEventPayload> {
  protected static event = ArticleHasBeenDeleted;

  public payload: ArticleHasBeenDeletedEventPayload;

  public constructor(payload: ArticleHasBeenDeletedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return ArticleHasBeenDeletedEvent.event;
  }
}
