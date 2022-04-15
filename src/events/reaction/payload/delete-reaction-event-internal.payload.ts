import { CommentResponseDto } from '../../../modules/comment/dto/response';
import { PostResponseDto } from '../../../modules/post/dto/responses';
import { ReactionDto } from '../../../modules/reaction/dto/reaction.dto';
import { UserSharedDto } from '../../../shared/user/dto';

export class DeleteReactionEventInternalPayload {
  public userSharedDto: UserSharedDto;
  public reaction: ReactionDto;
  public post?: PostResponseDto;
  public comment?: CommentResponseDto;
}
