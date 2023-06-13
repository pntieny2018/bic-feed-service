import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  ids: string[];
  authUser: UserDto;
};
export class FindPostsByIdsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
