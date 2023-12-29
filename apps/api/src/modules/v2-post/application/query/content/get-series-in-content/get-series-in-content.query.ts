import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  contentId: string;
};
export class GetSeriesInContentQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
