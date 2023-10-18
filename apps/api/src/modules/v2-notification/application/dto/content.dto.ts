import { PostSettingDto, UserMentionDto } from '../../../v2-post/application/dto';

import { AudienceObjectDto } from './group.dto';
import { MediaObjectDto } from './media.dto';
import { ReactionObjectDto, ReactionsCountObjectDto } from './reaction.dto';
import { ActorObjectDto } from './user.dto';

export class ContentActivityObjectDto {
  public id: string;
  public actor: ActorObjectDto;
  public title: string;
  public contentType: string; // lower case
  public setting?: PostSettingDto;
  public audience: AudienceObjectDto;

  // for Post/Article
  public content?: string;
  public mentions?: UserMentionDto;

  // for Post/Article reaction
  public reaction?: ReactionObjectDto;
  public reactionsOfActor?: ReactionObjectDto[];
  public reactionsCount?: ReactionsCountObjectDto;

  // for Series change item
  public state?: 'add' | 'remove';

  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: ContentActivityObjectDto) {
    this.id = data.id;
    this.actor = new ActorObjectDto(data.actor);
    this.title = data.title;
    this.contentType = data.contentType.toLowerCase();
    this.setting = data.setting ? new PostSettingDto(data.setting) : undefined;
    this.audience = new AudienceObjectDto(data.audience);
    this.content = data.content;
    this.mentions = data.mentions;
    this.reaction = data.reaction ? new ReactionObjectDto(data.reaction) : undefined;
    this.reactionsOfActor = data.reactionsOfActor
      ? data.reactionsOfActor.map((reaction) => new ReactionObjectDto(reaction))
      : undefined;
    this.reactionsCount = data.reactionsCount;
    this.state = data.state;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class PostActivityObjectDto extends ContentActivityObjectDto {
  public media: MediaObjectDto;

  public constructor(data: PostActivityObjectDto) {
    super(data);
    this.media = new MediaObjectDto(data.media);
  }
}

export class ArticleActivityObjectDto extends ContentActivityObjectDto {
  public summary?: string;
  public cover?: string;

  public constructor(data: ArticleActivityObjectDto) {
    super(data);
    this.summary = data.summary;
    this.cover = data.cover;
  }
}

export class SeriesActivityObjectDto extends ContentActivityObjectDto {
  public item?: PostActivityObjectDto | ArticleActivityObjectDto;
  public items?: (PostActivityObjectDto | ArticleActivityObjectDto)[];

  public constructor(data: SeriesActivityObjectDto) {
    super(data);
    this.item = data.item;
    this.items = data.items;
  }
}
