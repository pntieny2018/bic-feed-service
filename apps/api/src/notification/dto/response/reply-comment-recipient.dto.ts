export class ReplyCommentRecipientDto {
  public parentCommentCreatorId: string;

  public mentionedUserIdsInComment: string[];

  public mentionedUserIdsInParentComment: string[];

  public mentionedUserIdsInPrevChildComment: string[];

  public prevChildCommentCreatorIds: string[];

  public static init(): ReplyCommentRecipientDto {
    return new ReplyCommentRecipientDto(null, [], [], [], []);
  }

  public constructor(
    parentCommentCreatorId: string,
    mentionedUserIdsInComment: string[],
    mentionedUserIdsInParentComment: string[],
    prevChildCommentCreatorIds: string[],
    mentionedUserIdsInPrevChildComment: string[]
  ) {
    this.parentCommentCreatorId = parentCommentCreatorId;
    this.mentionedUserIdsInComment = mentionedUserIdsInComment;
    this.mentionedUserIdsInParentComment = mentionedUserIdsInParentComment;
    this.prevChildCommentCreatorIds = prevChildCommentCreatorIds;
    this.mentionedUserIdsInPrevChildComment = mentionedUserIdsInPrevChildComment;
  }
}
