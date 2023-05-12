import { IQuery } from '@nestjs/cqrs';

type Props = {
  name?: string;
  level?: number;
  isCreatedByMe?: boolean;
  offset: number;
  limit: number;
};

export class FindCategoriesPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
