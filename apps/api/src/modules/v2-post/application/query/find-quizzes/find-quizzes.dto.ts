import { IPaginatedInfo, PaginatedResponse } from '../../../../../common/dto/cusor-pagination';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';

export class FindQuizzesDto extends PaginatedResponse<PostDto | ArticleDto | SeriesDto> {
  public constructor(list: (PostDto | ArticleDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
