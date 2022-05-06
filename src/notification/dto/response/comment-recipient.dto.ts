export class CommentRecipientDto {
  public postOwnerId: number;
  public mentionedUsersInComment: number[];
  public mentionedUsersInPost: number[];
  public actorIdsOfPrevComments: number[];

  public static init(): CommentRecipientDto {
    return new CommentRecipientDto(null, [], [], []);
  }
  public constructor(
    postOwnerId: number,
    mentionedUsersInComment: number[],
    mentionedUsersInPost: number[],
    actorIdsOfPrevComments: number[]
  ) {
    this.postOwnerId = postOwnerId;
    this.mentionedUsersInComment = mentionedUsersInComment;
    this.mentionedUsersInPost = mentionedUsersInPost;
    this.actorIdsOfPrevComments = actorIdsOfPrevComments;
  }
}
