import { ORDER } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  authUser?: UserDto;
  postId: string;
  parentId: string;
  limit: number;
  before?: string;
  after?: string;
  order: ORDER;
};

export class FindCommentsPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
