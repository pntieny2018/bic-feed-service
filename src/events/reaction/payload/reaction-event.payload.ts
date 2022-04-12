import { IComment } from '../../../database/models/comment.model';
import { IPost } from '../../../database/models/post.model';
import { ReactionDto } from '../../../modules/reaction/dto/reaction.dto';

export class ReactionEventPayload {
  public reaction: ReactionDto;
  public post?: IPost;
  public comment?: IComment;
}
