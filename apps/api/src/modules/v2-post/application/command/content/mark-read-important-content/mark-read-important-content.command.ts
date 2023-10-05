import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

export type MarkReadImportantContentCommandPayload = {
  id: string;
  authUser: UserDto;
};
export class MarkReadImportantContentCommand implements ICommand {
  public constructor(public readonly payload: MarkReadImportantContentCommandPayload) {}
}
