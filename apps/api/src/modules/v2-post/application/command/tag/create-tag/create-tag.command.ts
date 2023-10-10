import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type CreateTagCommandPayload = {
  groupId: string;
  name: string;
  user: UserDto;
};
export class CreateTagCommand implements ICommand {
  public constructor(public readonly payload: CreateTagCommandPayload) {}
}
