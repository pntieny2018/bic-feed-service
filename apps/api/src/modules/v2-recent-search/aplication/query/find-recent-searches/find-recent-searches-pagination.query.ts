import { ORDER } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  keyword?: string;
  target?: string;
  userId: string;
  order?: ORDER;
  offset: number;
  limit: number;
};

export class FindRecentSearchesPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
