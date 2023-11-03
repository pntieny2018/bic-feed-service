import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type UpdateTagPayload = {
  id: string;
  name: string;
  actor: UserDto;
};
export class UpdateTagCommand implements ICommand {
  public constructor(public readonly payload: UpdateTagPayload) {}
}
