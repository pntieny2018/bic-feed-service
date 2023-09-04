import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application/user.dto';

export type DeleteCommentCommandPayload = {
  id: string;

  actor: UserDto;
};

export class DeleteCommentCommand implements ICommand {
  public constructor(public readonly payload: DeleteCommentCommandPayload) {}
}
