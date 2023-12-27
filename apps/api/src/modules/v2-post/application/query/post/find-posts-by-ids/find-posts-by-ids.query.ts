import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  ids: string[];
  authUser: UserDto;
};
export class FindPostsByIdsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
