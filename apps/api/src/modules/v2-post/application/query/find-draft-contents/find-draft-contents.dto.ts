import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { IPaginatedInfo, PaginatedResponse } from '../../../../../common/dto/cusor-pagination';

export class FindDraftContentsDto extends PaginatedResponse<PostDto | ArticleDto | SeriesDto> {
  public constructor(list: (PostDto | ArticleDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
