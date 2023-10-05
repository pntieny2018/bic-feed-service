import { CONTENT_TYPE, ORDER, QUIZ_STATUS } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  authUser: UserDto;
  status: QUIZ_STATUS;
  type?: CONTENT_TYPE;
  limit: number;
  order: ORDER;
  before?: string;
  after?: string;
};

export class FindQuizzesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
