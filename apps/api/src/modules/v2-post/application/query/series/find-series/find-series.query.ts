import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  seriesId: string;
  authUser: UserDto;
};
export class FindSeriesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
