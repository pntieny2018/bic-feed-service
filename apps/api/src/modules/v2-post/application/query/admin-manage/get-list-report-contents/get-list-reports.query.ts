import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type GetListReportsQueryPayload = {
  groupId: string;
  authUser: UserDto;
  limit: number;
  before?: string;
  after?: string;
};

export class GetListReportsQuery implements IQuery {
  public constructor(public payload: GetListReportsQueryPayload) {}
}
