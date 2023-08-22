import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  authUser: UserDto;
  id: string;
};
export class GetMenuSettingsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
