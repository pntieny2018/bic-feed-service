import { IQuery } from '@nestjs/cqrs';

type Props = {
  keyword?: string;
  target?: string;
  offset: number;
  limit: number;
};

export class FindRecentSearchesPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
