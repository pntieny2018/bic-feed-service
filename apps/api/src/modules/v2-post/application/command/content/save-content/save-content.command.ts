import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

type SaveContentProps = {
  authUser: UserDto;
  contentId: string;
};

export class SaveContentCommand implements ICommand {
  public constructor(public readonly payload: SaveContentProps) {}
}
