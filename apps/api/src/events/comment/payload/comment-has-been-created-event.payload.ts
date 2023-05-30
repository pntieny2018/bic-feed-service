import { UserDto } from '../../../modules/v2-user/application';

export class CommentHasBeenCreatedEventPayload {
  public actor: UserDto;
  public commentId: string;
}
