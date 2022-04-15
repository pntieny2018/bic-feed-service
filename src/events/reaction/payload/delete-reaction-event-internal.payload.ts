import { IComment } from '../../../database/models/comment.model';
import { IPost } from '../../../database/models/post.model';
import { ReactionDto } from '../../../modules/reaction/dto/reaction.dto';
import { UserSharedDto } from '../../../shared/user/dto';

export class DeleteReactionEventInternalPayload {
  public userSharedDto: UserSharedDto;
  public reaction: ReactionDto;
  public post?: IPost;
  public comment?: IComment;
}
