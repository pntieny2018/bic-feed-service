import { IQuery } from '@nestjs/cqrs';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  authUser?: UserDto;
  postId: string;
  parentId: string;
  limit: number;
  before?: string;
  after?: string;
  order: OrderEnum;
};

export class FindCommentsPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
