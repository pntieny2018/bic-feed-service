import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  commentId: string;
  authUser?: UserDto;
  limit?: number;
  targetChildLimit?: number;
};

export class FindCommentsAroundIdQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
