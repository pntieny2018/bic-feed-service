import { PostResponseDto } from '../../../modules/post/dto/responses';
import { CommentResponseDto } from '../../../modules/comment/dto/response';

export class CommentHasBeenCreatedEventPayload {
  public isReply: boolean;
  public postResponse: PostResponseDto;
  public commentResponse: CommentResponseDto;
}
