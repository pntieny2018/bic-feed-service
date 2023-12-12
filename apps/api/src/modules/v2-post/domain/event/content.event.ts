import { IEventPayload } from '@libs/infra/event';

import { ContentAttachedSeries, ContentGetDetail } from '../../../../common/constants';

interface CContentGetDetailEventPayload {
  contentId: string;
  userId: string;
}

interface ContentAttachedSeriesEventPayload {
  contentId: string;
}

export class ContentGetDetailEvent implements IEventPayload {
  public static event = ContentGetDetail;

  public payload: CContentGetDetailEventPayload;

  public constructor(data: CContentGetDetailEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ContentGetDetailEvent.event;
  }
}

export class ContentAttachedSeriesEvent implements IEventPayload {
  public static event = ContentAttachedSeries;

  public payload: ContentAttachedSeriesEventPayload;

  public constructor(data: ContentAttachedSeriesEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ContentAttachedSeriesEvent.event;
  }
}
