import { ORDER } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: ORDER;
  limit: number;
};
export class FindReactionsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
