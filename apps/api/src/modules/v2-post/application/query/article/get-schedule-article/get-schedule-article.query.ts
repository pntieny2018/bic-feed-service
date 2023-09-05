import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

export class GetArticleByParamsProps extends PaginatedArgs {
  public statuses: [CONTENT_STATUS.WAITING_SCHEDULE, CONTENT_STATUS.SCHEDULE_FAILED];
  public order: ORDER;
  public user: UserDto;
}

export class GetScheduleArticleQuery implements IQuery {
  public constructor(public readonly payload: GetArticleByParamsProps) {}
}
