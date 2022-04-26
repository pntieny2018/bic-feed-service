import { IPost } from '../../../database/models/post.model';
import { CommentResponseDto } from '../../../modules/comment/dto/response';

export class CommentHasBeenCreatedEventPayload {
  public isReply: boolean;
  public post: IPost;
  public commentResponse: CommentResponseDto;
}
