import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';
import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import { PostPrivacy, PostStatus, PostType } from '../../../../database/models/post.model';

import { ArticleDto, FileDto, ImageDto, PostDto, PostSettingDto, QuizDto, VideoDto } from '.';

export class SeriesDto {
  public id: string;

  public title: string;

  public summary: string;

  public audience: {
    groups: GroupDto[];
  };

  public communities?: GroupDto[];

  public items?: Partial<PostDto | ArticleDto>[];

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

  public highlight?: string;

  public titleHighlight?: string;

  public summaryHighlight?: string;

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

export class SearchSeriesDto {
  public id: string;
  public title: string;
  public summary: string;
  public coverMedia?: ImageDto;
  public audience: {
    groups: GroupDto[];
  };

  public constructor(data: Partial<SearchSeriesDto>) {
    Object.assign(this, data);
  }
}

export class ContentsInSeriesDto {
  public id: string;
  public title: string;
  public content: string;
  public summary: string;
  public type: CONTENT_TYPE;
  public actor: UserDto;
  public audience: {
    groups: GroupDto[];
  };
  public coverMedia?: ImageDto;
  public media?: {
    files: FileDto[];
    images: ImageDto[];
    videos: VideoDto[];
  };
  public categories?: {
    id: string;
    name: string;
  }[];

  public constructor(data: Partial<ContentsInSeriesDto>) {
    Object.assign(this, data);
  }
}

export class SearchContentsBySeriesDto extends PaginatedResponse<ContentsInSeriesDto> {
  public constructor(list: ContentsInSeriesDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
