import { SeriesHasBeenDeleted } from '../../common/constants';
import { IEvent } from '../../common/interfaces';

export class SeriesReoderArticlesEvent implements IEvent<ISeriesReorderArticlesPayload> {
  protected static event = SeriesHasBeenDeleted;

  public payload: ISeriesReorderArticlesPayload;

  public constructor(payload: ISeriesReorderArticlesPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesReoderArticlesEvent.event;
  }
}

export interface ISeriesReorderArticlesPayload {
  seriesId: string;
  articleIds: string[];
}
