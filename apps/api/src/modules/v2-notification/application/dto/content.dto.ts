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
  public reactionsCount?: ReactionsCountObjectDto[];

  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: ContentActivityObjectDto) {
    Object.assign(this, data);
  }
}

export class PostActivityObjectDto extends ContentActivityObjectDto {
  public media: MediaObjectDto;

  public constructor(data: PostActivityObjectDto) {
    super(data);
  }
}

export class ArticleActivityObjectDto extends ContentActivityObjectDto {
  public summary?: string;
  public cover?: string;

  public constructor(data: ArticleActivityObjectDto) {
    super(data);
  }
}

export class SeriesActivityObjectDto extends ContentActivityObjectDto {
  public item?: PostActivityObjectDto | ArticleActivityObjectDto;

  public items?: SeriesStateActivityObjectDto[];

  public constructor(data: SeriesActivityObjectDto) {
    super(data);
  }
}

export class SeriesStateActivityObjectDto {
  public actor: {
    id: string;
  };
  public id: string;
  public title: string;
  public state: 'add' | 'remove';
  public audience?: AudienceObjectDto;

  public constructor(data: SeriesStateActivityObjectDto) {
    Object.assign(this, data);
  }
}
