import { PostPrivacy, PostStatus, PostType } from '../../../../database/models/post.model';
import { UserDto } from '../../../v2-user/application';
import { GroupDto } from '../../../v2-group/application';
import { ArticleDto, ImageDto, PostDto, PostSettingDto, QuizDto } from '.';

export class SeriesDto {
  public id: string;

  public title: string;

  public summary: string;

  public audience: {
    groups: GroupDto[];
  };

  public communities?: GroupDto[];

  public items?: Partial<PostDto | ArticleDto>[] = [];

  public setting: PostSettingDto;

  public isHidden?: boolean;

  public quiz?: QuizDto;

  public coverMedia?: ImageDto;

  public actor: UserDto;

  public status: PostStatus;

  public privacy: PostPrivacy;

  public type: PostType;

  public markedReadPost?: boolean;

  public isSaved?: boolean;

  public commentsCount: number;

  public totalUsersSeen: number;
  public isReported: boolean;

  public createdAt: Date;

  public updatedAt?: Date;

  public publishedAt?: Date;

  public createdBy: string;

  public constructor(data: Partial<SeriesDto>) {
    Object.assign(this, data);
  }
}

export class CreateSeriesDto extends SeriesDto {
  public constructor(data: Partial<CreateSeriesDto>) {
    super(data);
  }
}

export class FindItemsBySeriesDto {
  public series: {
    id: string;
    title: string;
    summary: string;
    items: {
      id: string;
      title: string;
      type: PostType;
    }[];
  }[];
  public constructor(data: FindItemsBySeriesDto) {
    Object.assign(this, data);
  }
}
