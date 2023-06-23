import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type PublishArticleCommandPayload = {
  id: string;

  actor: UserDto;
};

export class PublishArticleCommand implements ICommand {
  public constructor(public readonly payload: PublishArticleCommandPayload) {}
}
