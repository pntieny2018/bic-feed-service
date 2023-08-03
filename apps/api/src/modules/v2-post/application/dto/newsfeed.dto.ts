import { IPaginatedInfo, PaginatedResponse } from '../../../../common/dto';
import { ArticleDto } from './article.dto';
import { PostDto } from './post.dto';
import { SeriesDto } from './series.dto';

export class FindNewsfeedDto extends PaginatedResponse<ArticleDto | PostDto | SeriesDto> {
  public constructor(list: (ArticleDto | PostDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
