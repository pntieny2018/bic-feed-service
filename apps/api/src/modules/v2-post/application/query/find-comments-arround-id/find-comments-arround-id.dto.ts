import { CommentResponseDto } from '../../../driving-apdater/dto/response';
import { IPaginatedInfo, PaginatedResponse } from '../../../../../common/dto/cusor-pagination';

export class FindCommentsArroundIdDto extends PaginatedResponse<CommentResponseDto> {
  public constructor(list: CommentResponseDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
