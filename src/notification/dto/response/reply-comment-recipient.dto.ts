export class ReplyCommentRecipientDto {
  public parentCommentCreatorId: number;

  public mentionedUserIdsInComment: number[];

  public mentionedUserIdsInParentComment: number[];

  public mentionedUserIdsInPrevChildComment: number[];

  public prevChildCommentCreatorIds: number[];

  public static init(): ReplyCommentRecipientDto {
    return new ReplyCommentRecipientDto(null, [], [], [], []);
  }

  public constructor(
    parentCommentCreatorId: number,
    mentionedUserIdsInComment: number[],
    mentionedUserIdsInParentComment: number[],
    prevChildCommentCreatorIds: number[],
    mentionedUserIdsInPrevChildComment: number[]
  ) {
    this.parentCommentCreatorId = parentCommentCreatorId;
    this.mentionedUserIdsInComment = mentionedUserIdsInComment;
    this.mentionedUserIdsInParentComment = mentionedUserIdsInParentComment;
    this.prevChildCommentCreatorIds = prevChildCommentCreatorIds;
    this.mentionedUserIdsInPrevChildComment = mentionedUserIdsInPrevChildComment;
  }
}
