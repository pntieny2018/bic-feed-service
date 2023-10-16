import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  authUser: UserDto;

  contentSearch?: string;

  categoryIds?: string[];

  groupIds?: string[];

  limitSeries?: boolean;

  limit?: number;

  after?: string;
};

export class SearchArticleQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
