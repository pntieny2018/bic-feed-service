import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type GetReportPayload = {
  groupId: string;
  reportId: string;
  authUser: UserDto;
};

export class GetReportQuery implements IQuery {
  public constructor(public readonly payload: GetReportPayload) {}
}
