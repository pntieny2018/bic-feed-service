import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  postId: string;
  authUser: UserDto;
};
export class FindPostQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
