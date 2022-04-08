import { ReactionDto } from '../../../modules/reaction/dto/reaction.dto';
import { UserSharedDto } from '../../../shared/user/dto';

export class DeleteReactionEventInternalPayload {
  public userSharedDto: UserSharedDto;
  public reaction: ReactionDto;
}
