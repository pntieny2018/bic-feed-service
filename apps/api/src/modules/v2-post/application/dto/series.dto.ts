import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';

import { PostPrivacy, PostStatus, PostType } from '../../../../database/models/post.model';
import { GroupDto } from '../../../v2-group/application';
import { UserDto } from '../../../v2-user/application';

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

  public status: PostStatus | CONTENT_STATUS;

  public privacy: PostPrivacy | PRIVACY;

  public type: PostType | CONTENT_TYPE;

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
