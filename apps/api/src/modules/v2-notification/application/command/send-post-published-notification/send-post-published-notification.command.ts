import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type SendPostPublishedNotificationCommandPayload = {
  groupIds: string[];
  authUser: UserDto;
};
export class SendPostPublishedNotificationCommand implements ICommand {
  public constructor(public readonly payload: SendPostPublishedNotificationCommandPayload) {}
}
