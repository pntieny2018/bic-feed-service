type ContentHasSeenEventPayload = {
  contentId: string;
  userId: string;
};

export class ContentHasSeenEvent {
  public constructor(public readonly payload: ContentHasSeenEventPayload) {}
}
