import { ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

class GetMyReportedContentsPayload extends PaginatedArgs {
  public authUser: UserDto;
  public limit: number;
  public order: ORDER;
  public before?: string;
  public after?: string;
}

export class GetMyReportedContentsQuery implements IQuery {
  public constructor(public readonly payload: GetMyReportedContentsPayload) {}
}
