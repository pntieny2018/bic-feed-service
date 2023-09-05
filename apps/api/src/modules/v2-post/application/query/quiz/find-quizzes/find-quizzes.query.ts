import { ORDER } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';
import { PostType, QuizStatus } from '../../../../data-type';

type Props = {
  authUser: UserDto;
  status: QuizStatus;
  type?: PostType;
  limit: number;
  order: ORDER;
  before?: string;
  after?: string;
};

export class FindQuizzesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
