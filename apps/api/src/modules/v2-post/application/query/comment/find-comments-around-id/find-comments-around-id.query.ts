import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  commentId: string;
  authUser?: UserDto;
  limit?: number;
  targetChildLimit?: number;
};

export class FindCommentsAroundIdQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
