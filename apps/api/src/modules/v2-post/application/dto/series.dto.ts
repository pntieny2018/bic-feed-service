import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';
import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';

import {
  ArticleInSeriesDto,
  ImageDto,
  ItemInSeries,
  MediaDto,
  PostInSeriesDto,
  PostSettingDto,
  QuizDto,
} from '.';

export class SeriesDto {
  public id: string;
  public isReported: boolean;
  public isHidden?: boolean;
  public createdBy: string;
  public actor: UserDto;
  public privacy: PRIVACY;
  public status: CONTENT_STATUS;
  public type: CONTENT_TYPE;
  public setting: PostSettingDto;
  public createdAt: Date;
  public updatedAt?: Date;
  public markedReadPost?: boolean;
  public isSaved?: boolean;
  public publishedAt?: Date;
  public audience: { groups: GroupDto[] };
  public communities?: GroupDto[];
  public commentsCount: number;
  public totalUsersSeen: number;
  public title: string;
  public summary: string;
  public items?: (PostInSeriesDto | ArticleInSeriesDto | ItemInSeries)[];
  public quiz?: QuizDto;
  public coverMedia?: ImageDto;
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
      type: CONTENT_TYPE;
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
  public media?: MediaDto;
  public categories?: {
    id: string;
    name: string;
  }[];
  public publishedAt?: Date;

  public constructor(data: Partial<ContentsInSeriesDto>) {
    Object.assign(this, data);
  }
}

export class SearchContentsBySeriesDto extends PaginatedResponse<ContentsInSeriesDto> {
  public constructor(list: ContentsInSeriesDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}

export class SeriesInContentDto {
  public id: string;
  public title: string;
  public createdBy?: string;
}

export class SeriesCacheDto {
  public id: string;
  public createdBy: string;
  public updatedBy: string;
  public isReported: boolean;
  public isHidden: boolean;
  public privacy: PRIVACY;
  public status: CONTENT_STATUS;
  public type: CONTENT_TYPE;
  public setting: PostSettingDto;
  public createdAt: Date;
  public updatedAt: Date;
  public publishedAt: Date;
  public groups: string[];
  public title: string;
  public summary: string;
  public itemsIds: string[];
  public coverMedia: ImageDto;

  public constructor(data: SeriesCacheDto) {
    Object.assign(this, data);
  }
}
