import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

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
