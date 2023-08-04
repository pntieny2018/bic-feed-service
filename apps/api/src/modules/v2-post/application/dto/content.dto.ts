import { IPaginatedInfo, PaginatedResponse } from '../../../../common/dto';
import { PostDto } from './post.dto';
import { ArticleDto } from './article.dto';
import { SeriesDto } from './series.dto';

export class FindDraftContentsDto extends PaginatedResponse<PostDto | ArticleDto | SeriesDto> {
  public constructor(list: (PostDto | ArticleDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
