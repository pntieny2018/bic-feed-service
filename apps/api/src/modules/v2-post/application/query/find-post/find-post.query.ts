import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  postId: string;
  authUser: UserDto;
};
export class FindPostQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
