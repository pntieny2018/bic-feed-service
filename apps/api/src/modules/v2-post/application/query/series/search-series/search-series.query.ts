import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  authUser: UserDto;

  contentSearch?: string;

  itemIds?: string[];

  groupIds?: string[];

  limit?: number;

  offset?: number;
};

export class SearchSeriesQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
