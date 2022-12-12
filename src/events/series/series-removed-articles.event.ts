import { IEvent } from '../../common/interfaces';

export class SeriesRemovedArticlesEvent implements IEvent<ISeriesRemovedArticlesPayload> {
  protected static event = SeriesRemovedArticlesEvent.name;

  public payload: ISeriesRemovedArticlesPayload;

  public constructor(payload: ISeriesRemovedArticlesPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesRemovedArticlesEvent.event;
  }
}

export interface ISeriesRemovedArticlesPayload {
  seriesId: string;
  articleIds: string[];
}
