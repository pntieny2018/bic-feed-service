import { IQuery } from '@nestjs/cqrs';
import { OrderEnum } from '../../../../../common/dto';

type Props = {
  keyword?: string;
  target?: string;
  userId: string;
  order?: OrderEnum;
  offset: number;
  limit: number;
};

export class FindRecentSearchesPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
