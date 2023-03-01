import { UserDataShareDto } from '../../../../../shared/user/dto';

export class CreateReactionDto {
  public id: string;
  public reactionName: string;
  public createdAt: Date;
  public actor?: UserDataShareDto = null;
}
