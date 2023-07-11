import { IQuery } from '@nestjs/cqrs';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  authUser: UserDto;
  limit: number;
  order: OrderEnum;
  before?: string;
  after?: string;
};

export class FindDraftQuizzesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}