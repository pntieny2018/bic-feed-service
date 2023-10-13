import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  id: string;
};
export class GetMenuSettingsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
