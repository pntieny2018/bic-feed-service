import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type GetReportDetailsProps = {
  rootGroupId: string;
  reportId: string;
  authUser: UserDto;
};

export class GetReportDetailsQuery implements IQuery {
  public constructor(public readonly payload: GetReportDetailsProps) {}
}
