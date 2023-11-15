import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type UpdateContentSettingCommandPayload = {
  authUser: UserDto;
  id: string;
  canComment: boolean;
  canReact: boolean;
  isImportant: boolean;
  importantExpiredAt?: Date;
};
export class UpdateContentSettingCommand implements ICommand {
  public constructor(public readonly payload: UpdateContentSettingCommandPayload) {}
}
