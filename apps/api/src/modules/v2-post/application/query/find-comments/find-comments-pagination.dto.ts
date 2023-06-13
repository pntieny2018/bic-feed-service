import { IPaginatedInfo, PaginatedResponse } from '../../../../../common/dto/cusor-pagination';
import { CommentResponseDto } from '../../../driving-apdater/dto/response';

export class FindCommentsPaginationDto extends PaginatedResponse<CommentResponseDto> {
  public constructor(list: CommentResponseDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
