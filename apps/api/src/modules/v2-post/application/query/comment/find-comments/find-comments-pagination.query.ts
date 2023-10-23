import { ORDER } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser?: UserDto;
  contentId: string;
  parentId: string;
  limit: number;
  before?: string;
  after?: string;
  order: ORDER;
};

export class FindCommentsPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
