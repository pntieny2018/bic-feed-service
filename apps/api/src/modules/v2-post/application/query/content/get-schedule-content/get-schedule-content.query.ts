import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

export class GetScheduleContentProps extends PaginatedArgs {
  public type?: Exclude<CONTENT_TYPE, CONTENT_TYPE.SERIES>;
  public order: ORDER;
  public user: UserDto;
}

export class GetScheduleContentQuery implements IQuery {
  public constructor(public readonly payload: GetScheduleContentProps) {}
}
