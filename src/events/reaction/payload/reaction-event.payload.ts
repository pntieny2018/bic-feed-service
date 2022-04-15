import { CommentResponseDto } from '../../../modules/comment/dto/response';
import { PostResponseDto } from '../../../modules/post/dto/responses';
import { ReactionDto } from '../../../modules/reaction/dto/reaction.dto';

export class ReactionEventPayload {
  public reaction: ReactionDto;
  public post?: PostResponseDto;
  public comment?: CommentResponseDto;
}
