type ContentHasSeenEventPayload = {
  contentId: string;
  userId: string;
};

type ContentAttachedSeriesEventPayload = {
  contentId: string;
};

export class ContentHasSeenEvent {
  public constructor(public readonly payload: ContentHasSeenEventPayload) {}
}

export class ContentAttachedSeriesEvent {
  public constructor(public readonly payload: ContentAttachedSeriesEventPayload) {}
}
