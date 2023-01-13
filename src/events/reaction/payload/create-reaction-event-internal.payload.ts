import { UserDataShareDto } from '../../../shared/user/dto';
import { PostResponseDto } from '../../../modules/post/dto/responses';
import { CommentResponseDto } from '../../../modules/comment/dto/response';
import { ReactionResponseDto } from '../../../modules/reaction/dto/response';

export class CreateReactionEventInternalPayload {
  public actor: UserDataShareDto;
  public reaction: ReactionResponseDto;
  public post: PostResponseDto;
  public comment?: CommentResponseDto;
}
