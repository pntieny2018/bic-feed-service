type ContentHasSeenEventPayload = {
  contentId: string;
  userId: string;
};

type ContentChangedSeriesEventPayload = {
  contentIds: string[];
};

export class ContentHasSeenEvent {
  public constructor(public readonly payload: ContentHasSeenEventPayload) {}
}

export class ContentChangedSeriesEvent {
  public constructor(public readonly payload: ContentChangedSeriesEventPayload) {}
}
