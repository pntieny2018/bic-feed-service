import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type DeleteArticleCommandPayload = {
  id: string;

  actor: UserDto;
};

export class DeleteArticleCommand implements ICommand {
  public constructor(public readonly payload: DeleteArticleCommandPayload) {}
}
