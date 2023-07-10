import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

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
