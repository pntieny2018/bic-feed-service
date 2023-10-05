import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type MarkReadImportantContentCommandPayload = {
  id: string;
  authUser: UserDto;
};
export class MarkReadImportantContentCommand implements ICommand {
  public constructor(public readonly payload: MarkReadImportantContentCommandPayload) {}
}
