import { IPaginatedInfo, PaginatedResponse } from '../../../../../common/dto/cusor-pagination';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';

export class SearchContentsDto extends PaginatedResponse<ArticleDto | PostDto | SeriesDto> {
  public constructor(list: (ArticleDto | PostDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
