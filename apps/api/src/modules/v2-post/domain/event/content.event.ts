import { IEventPayload } from '@libs/infra/event';

import {
  ContentAttachedSeries,
  ContentGetDetail,
  ContentUpdateSetting,
} from '../../../../common/constants';

interface ContentGetDetailEventPayload {
  contentId: string;
  userId: string;
}

interface ContentAttachedSeriesEventPayload {
  contentId: string;
}

interface ContentUpdateSettingEventPayload {
  contentId: string;
}

export class ContentGetDetailEvent implements IEventPayload {
  public static event = ContentGetDetail;

  public payload: ContentGetDetailEventPayload;

  public constructor(data: ContentGetDetailEventPayload) {
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

export class ContentUpdateSettingEvent implements IEventPayload {
  public static event = ContentUpdateSetting;

  public payload: ContentUpdateSettingEventPayload;

  public constructor(data: ContentUpdateSettingEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ContentUpdateSettingEvent.event;
  }
}
