import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type PinContentCommandProps = {
  authUser: UserDto;
  contentId: string;
  pinGroupIds: string[];
  unpinGroupIds: string[];
};

export class PinContentCommand implements ICommand {
  public constructor(public readonly payload: PinContentCommandProps) {}
}
