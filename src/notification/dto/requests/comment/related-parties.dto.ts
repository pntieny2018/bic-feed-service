export class RelatedPartiesDto {
  public currentMentionedUserIds?: number[];

  // replied
  public parentCommentActor?: number;
  public parentMentionedUserIds?: number[];
  public repliedUserIds?: number[];
  public mentionedInRepliedCommentUserIds?: number[];

  // created
  public postOwnerId?: number;
  public mentionedPostUserId?: number[];
  public rootCommentedUserIds?: number[];
  public rootMentionedUserIds?: number[];

  // updated

  public mentionedUserIds?: number[];
}
