import { IEventPayload } from '@libs/infra/event';

import { ContentAttachedSeries, ContentHasBeenSeen } from '../../../../common/constants';

interface ContentHasSeenEventPayload {
  contentId: string;
  userId: string;
}

interface ContentAttachedSeriesEventPayload {
  contentId: string;
}

export class ContentHasSeenEvent implements IEventPayload {
  public static event = ContentHasBeenSeen;

  public payload: ContentHasSeenEventPayload;

  public constructor(data: ContentHasSeenEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ContentHasSeenEvent.event;
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
