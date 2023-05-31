import { CommentDto } from '../../dto/comment.dto';
export class ReplyCommentDto extends CommentDto {
  public constructor(data: Partial<ReplyCommentDto>) {
    super(data);
  }
}
