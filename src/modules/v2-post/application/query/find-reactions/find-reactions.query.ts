import { IQuery } from '@nestjs/cqrs';

type Props = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: string;
  limit: number;
};
export class FindReactionsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
