import { IEvent } from '../../common/interfaces';
import { UserSharedDto } from '../../shared/user/dto';

export class SeriesAddedArticlesEvent implements IEvent<ISeriesAddArticlesPayload> {
  public payload: ISeriesAddArticlesPayload;
  protected static event = SeriesAddedArticlesEvent.name;
  public constructor(payload: ISeriesAddArticlesPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return SeriesAddedArticlesEvent.event;
  }
}

export interface ISeriesAddArticlesPayload {
  isAdded: boolean;
  seriesId: string;
  articleIds: string[];
  actor: UserSharedDto;
}
