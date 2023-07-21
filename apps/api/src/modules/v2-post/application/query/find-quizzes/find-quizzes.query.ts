import { IQuery } from '@nestjs/cqrs';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';
import { PostType, QuizStatus } from '../../../data-type';

type Props = {
  authUser: UserDto;
  status: QuizStatus;
  type?: PostType;
  limit: number;
  order: OrderEnum;
  before?: string;
  after?: string;
};

export class FindQuizzesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
