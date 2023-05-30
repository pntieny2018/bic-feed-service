import { IQueryResult } from '@nestjs/cqrs';
import { ReactionDto } from '../../dto';

export class FindReactionsDto implements IQueryResult {
  public readonly rows: ReactionDto[];
  public readonly total: number;
  public constructor(data: Partial<FindReactionsDto>) {
    Object.assign(this, data);
  }
}
