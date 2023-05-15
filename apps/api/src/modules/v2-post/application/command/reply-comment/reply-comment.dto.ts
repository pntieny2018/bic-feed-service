import { CreateCommentDto } from '../create-comment/create-comment.dto';

export class ReplyCommentDto extends CreateCommentDto {
  public constructor(data: Partial<ReplyCommentDto>) {
    super(data);
  }
}
