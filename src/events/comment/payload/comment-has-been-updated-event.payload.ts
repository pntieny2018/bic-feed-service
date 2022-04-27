import { IComment } from '../../../database/models/comment.model';
import { CommentResponseDto } from '../../../modules/comment/dto/response';
import { PostResponseDto } from '../../../modules/post/dto/responses';

export class CommentHasBeenUpdatedEventPayload {
  public postResponse: PostResponseDto;
  public newComment: IComment;
  public oldComment: IComment;
  public commentResponse: CommentResponseDto;
}
