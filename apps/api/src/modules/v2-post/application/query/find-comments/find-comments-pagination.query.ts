import { IQuery } from '@nestjs/cqrs';
import { OrderEnum } from '../../../../../common/dto';

type Props = {
  authUserId?: string;
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
