import { CONTENT_STATUS } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

import { PageOptionsDto } from '../../../../../../common/dto';

export class GetArticleByParamsProps extends PageOptionsDto {
  public statuses: CONTENT_STATUS[];
  public user: UserDto;
}

export class GetScheduleArticleQuery implements IQuery {
  public constructor(public readonly payload: GetArticleByParamsProps) {}
}
