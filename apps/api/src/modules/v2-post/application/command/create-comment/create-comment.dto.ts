import { CommentDto } from '../../dto/comment.dto';

export class CreateCommentDto extends CommentDto {
  public constructor(data: Partial<CreateCommentDto>) {
    super(data);
  }
}
