import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

type HideReportPayload = {
  groupId: string;
  reportId: string;
  authUser: UserDto;
};

export class HideReportCommand implements ICommand {
  public constructor(public readonly payload: HideReportPayload) {}
}
