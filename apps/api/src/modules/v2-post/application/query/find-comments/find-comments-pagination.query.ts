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
  createdAtGT?: string;
  createdAtLT?: string;
  createdAtGTE?: string;
  createdAtLTE?: string;
};

export class FindCommentsPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
