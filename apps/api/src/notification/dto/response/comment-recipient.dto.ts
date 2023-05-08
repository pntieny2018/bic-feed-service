export class CommentRecipientDto {
  public postOwnerId: string;
  public mentionedUsersInComment: string[];
  public mentionedUsersInPost: string[];
  public actorIdsOfPrevComments: string[];

  public static init(): CommentRecipientDto {
    return new CommentRecipientDto(null, [], [], []);
  }
  public constructor(
    postOwnerId: string,
    mentionedUsersInComment: string[],
    mentionedUsersInPost: string[],
    actorIdsOfPrevComments: string[]
  ) {
    this.postOwnerId = postOwnerId;
    this.mentionedUsersInComment = mentionedUsersInComment;
    this.mentionedUsersInPost = mentionedUsersInPost;
    this.actorIdsOfPrevComments = actorIdsOfPrevComments;
  }
}
