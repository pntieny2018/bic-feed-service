import { PostResponseDto } from '../../../modules/post/dto/responses';
import { CommentResponseDto } from '../../../modules/comment/dto/response';
import { ReactionResponseDto } from '../../../modules/reaction/dto/response';
import { UserDto } from '../../../modules/v2-user/application';

export class DeleteReactionEventInternalPayload {
  public actor: UserDto;
  public reaction: ReactionResponseDto;
  public post: PostResponseDto;
  public comment?: CommentResponseDto;
}
