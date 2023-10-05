import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type DeleteArticleCommandPayload = {
  id: string;
  actor: UserDto;
};

export class DeleteArticleCommand implements ICommand {
  public constructor(public readonly payload: DeleteArticleCommandPayload) {}
}
