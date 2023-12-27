import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  seriesIds: string[];
  authUser: UserDto;
};
export class FindItemsBySeriesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
