import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

type IgnoreReportPayload = {
  groupId: string;
  reportId: string;
  authUser: UserDto;
};

export class IgnoreReportCommand implements ICommand {
  public constructor(public readonly payload: IgnoreReportPayload) {}
}
