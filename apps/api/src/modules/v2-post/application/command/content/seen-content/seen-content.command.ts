import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

type SeenContentCommandProps = {
  authUser: UserDto;
  contentId: string;
};

export class SeenContentCommand implements ICommand {
  public constructor(public readonly payload: SeenContentCommandProps) {}
}
