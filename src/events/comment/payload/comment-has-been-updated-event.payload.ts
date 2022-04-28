import { IPost } from '../../../database/models/post.model';
import { IComment } from '../../../database/models/comment.model';
import { CommentResponseDto } from '../../../modules/comment/dto/response';

export class CommentHasBeenUpdatedEventPayload {
  public post: IPost;
  public newComment: IComment;
  public oldComment: IComment;
  public commentResponse: CommentResponseDto;
  public oldCommentResponse: CommentResponseDto;
}
