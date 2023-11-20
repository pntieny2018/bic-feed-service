import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

type UnsaveContentCommandPayload = {
  authUser: UserDto;
  contentId: string;
};

export class UnsaveContentCommand implements ICommand {
  public constructor(public readonly payload: UnsaveContentCommandPayload) {}
}
