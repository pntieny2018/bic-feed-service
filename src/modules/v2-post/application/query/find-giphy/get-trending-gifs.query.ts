import { IQuery } from '@nestjs/cqrs';

type Props = {
  limit?: number;
  rating?: string;
  type?: string;
};

export class GetTrendingGifsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
