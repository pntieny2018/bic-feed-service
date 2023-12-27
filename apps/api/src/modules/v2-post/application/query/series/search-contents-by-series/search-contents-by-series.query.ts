import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;

  seriesId: string;

  keyword?: string;

  limit?: number;

  after?: string;
};

export class SearchContentsBySeriesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
