import { IPaginatedInfo, PaginatedResponse } from '../../../../../common/dto/cusor-pagination';
import { CommentDto } from '../../dto/comment.dto';

export class FindCommentsPaginationDto extends PaginatedResponse<CommentDto> {
  public constructor(list: CommentDto[], meta: IPaginatedInfo) {
    super(list, meta);
  }
}
