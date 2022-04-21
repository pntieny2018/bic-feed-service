import { UserDto } from '../../../auth';
import { CreateReactionDto } from './create-reaction.dto';
import { DeleteReactionDto } from './delete-reaction.dto';

export class JobReactionDataDto {
  public userDto: UserDto;
  public payload: CreateReactionDto | DeleteReactionDto;
}
