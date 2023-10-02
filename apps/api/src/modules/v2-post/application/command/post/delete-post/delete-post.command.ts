import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type DeletePostPayload = {
  postId: string;
  authUser: UserDto;
};

export class DeletePostCommand implements ICommand {
  public constructor(public readonly payload: DeletePostPayload) {}
}
