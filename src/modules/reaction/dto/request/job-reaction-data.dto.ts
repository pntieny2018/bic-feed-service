import { UserDto } from '../../../auth';
import { CreateReactionDto } from './create-reaction.dto';
import { DeleteReactionDto } from './delete-reaction.dto';
export enum ReactionAction {
  CREATE = 'CREATE',
  DELETE = 'DELETE',
}
export class JobReactionDataDto {
  public action: ReactionAction;
  public userDto: UserDto;
  public createReactionDto?: CreateReactionDto;
  public deleteReactionDto?: DeleteReactionDto;
}
