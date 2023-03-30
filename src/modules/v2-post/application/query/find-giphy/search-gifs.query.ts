import { IQuery } from '@nestjs/cqrs';

type Props = {
  limit?: number;
  rating?: string;
  type: string;
  q: string;
  offset?: number;
  lang?: string;
};

export class SearchGifsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
