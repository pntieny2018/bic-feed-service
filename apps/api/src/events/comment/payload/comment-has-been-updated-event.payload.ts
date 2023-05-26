import { CommentResponseDto } from '../../../modules/comment/dto/response';
import { UserDto } from '../../../modules/v2-user/application';

export class CommentHasBeenUpdatedEventPayload {
  public actor: UserDto;
  public oldMentions: string[];
  public commentId: string;
  public oldCommentResponse?: CommentResponseDto;
}
