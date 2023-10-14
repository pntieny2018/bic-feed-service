type ContentHasSeenEventPayload = {
  contentId: string;
  userId: string;
};

type ContentChangedAttachedSeriesPayload = {
  contentIds: string[];
};

export class ContentHasSeenEvent {
  public constructor(public readonly payload: ContentHasSeenEventPayload) {}
}

export class ContentChangedAttachedSeriesEvent {
  public constructor(public readonly payload: ContentChangedAttachedSeriesPayload) {}
}
