import { IQuery } from '@nestjs/cqrs';

type Props = {
  groupIds: string[];
  offset: number;
  limit: number;
  name?: string;
};
export class FindTagsPaginationQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
