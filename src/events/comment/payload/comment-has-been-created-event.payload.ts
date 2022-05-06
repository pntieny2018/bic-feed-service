import { UserDto } from '../../../modules/auth';
import { CommentResponseDto } from '../../../modules/comment/dto/response';

export class CommentHasBeenCreatedEventPayload {
  public actor: UserDto;
  public commentResponse: CommentResponseDto;
}
