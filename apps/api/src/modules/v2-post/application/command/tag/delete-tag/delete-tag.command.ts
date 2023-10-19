import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type DeleteTagCommandPayload = {
  id: string;
  actor: UserDto;
};
export class DeleteTagCommand implements ICommand {
  public constructor(public readonly payload: DeleteTagCommandPayload) {}
}
