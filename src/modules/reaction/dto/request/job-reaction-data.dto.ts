import { UserDto } from '../../../auth';
import { CreateReactionDto } from './create-reaction.dto';
import { DeleteReactionDto } from './delete-reaction.dto';
export enum ActionReaction {
  ADD = 'add',
  REMOVE = 'remove',
}
export class JobReactionDataDto {
  public userDto: UserDto;
  public payload: CreateReactionDto | DeleteReactionDto;
  public action: ActionReaction;
}
