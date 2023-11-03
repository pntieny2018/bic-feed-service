import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';

import { GroupAudience } from '../../domain/domain-service/interface';

import { ArticleDto } from './article.dto';
import { PostDto } from './post.dto';
import { SeriesDto } from './series.dto';

export class FindDraftContentsDto extends PaginatedResponse<PostDto | ArticleDto | SeriesDto> {
  public constructor(list: (PostDto | ArticleDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
export class SearchContentsDto extends PaginatedResponse<ArticleDto | PostDto | SeriesDto> {
  public constructor(list: (ArticleDto | PostDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}

export class GetScheduleContentsResponseDto extends PaginatedResponse<ArticleDto | PostDto> {
  public constructor(list: (ArticleDto | PostDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}

export class GetSeriesResponseDto {
  public list: SeriesDto[] = [];

  public constructor(list: SeriesDto[]) {
    this.list = list;
  }
}

export class GetAudienceResponseDto {
  public groups: GroupAudience[];

  public constructor(groups: GroupAudience[]) {
    this.groups = groups;
  }
}
