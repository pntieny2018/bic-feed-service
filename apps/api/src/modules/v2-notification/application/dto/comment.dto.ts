import { ContentActivityObjectDto } from './content.dto';
import { MediaObjectDto } from './media.dto';
import { ReactionObjectDto, ReactionsCountObjectDto } from './reaction.dto';
import { ActorObjectDto, UserMentionObjectDto } from './user.dto';

export class CommentRecipientDto {
  public postOwnerId: string;
  public mentionedUsersInComment: string[];
  public mentionedUsersInPost: string[];
  public actorIdsOfPrevComments: string[];

  public static init(): CommentRecipientDto {
    return new CommentRecipientDto({
      postOwnerId: null,
      mentionedUsersInComment: [],
      mentionedUsersInPost: [],
      actorIdsOfPrevComments: [],
    });
  }

  public constructor(data: CommentRecipientDto) {
    Object.assign(this, data);
  }
}

export class ReplyCommentRecipientDto {
  public parentCommentCreatorId: string;
  public mentionedUserIdsInComment: string[];
  public mentionedUserIdsInParentComment: string[];
  public mentionedUserIdsInPrevChildComment: string[];
  public prevChildCommentCreatorIds: string[];

  public static init(): ReplyCommentRecipientDto {
    return new ReplyCommentRecipientDto({
      parentCommentCreatorId: null,
      mentionedUserIdsInComment: [],
      mentionedUserIdsInParentComment: [],
      mentionedUserIdsInPrevChildComment: [],
      prevChildCommentCreatorIds: [],
    });
  }

  public constructor(data: ReplyCommentRecipientDto) {
    Object.assign(this, data);
  }
}

export class CommentActivityObjectDto extends ContentActivityObjectDto {
  public comment: CommentObjectDto;

  public constructor(data: CommentActivityObjectDto) {
    super(data);
    this.comment = new CommentObjectDto(data.comment);
  }
}

export class CommentObjectDto {
  public id: string;
  public actor: ActorObjectDto;
  public content: string;
  public media: MediaObjectDto;
  public mentions: UserMentionObjectDto;
  public giphyId: string;
  public giphyUrl: string;

  // for reply comment
  public child?: CommentObjectDto;

  // For Comment reaction
  public reaction?: ReactionObjectDto;
  public reactionsOfActor?: ReactionObjectDto[];
  public reactionsCount?: ReactionsCountObjectDto;

  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: CommentObjectDto) {
    this.id = data.id;
    this.actor = new ActorObjectDto(data.actor);
    this.content = data.content;
    this.media = new MediaObjectDto(data.media);
    this.mentions = data.mentions;
    this.giphyId = data.giphyId;
    this.giphyUrl = data.giphyUrl;
    this.child = data.child ? new CommentObjectDto(data.child) : undefined;
    this.reaction = data.reaction ? new ReactionObjectDto(data.reaction) : undefined;
    this.reactionsOfActor = data.reactionsOfActor
      ? data.reactionsOfActor.map((reaction) => new ReactionObjectDto(reaction))
      : undefined;
    this.reactionsCount = data.reactionsCount;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
