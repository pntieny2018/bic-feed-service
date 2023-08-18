import { IQuery } from '@nestjs/cqrs';

import { OrderEnum } from '../../../../../../common/dto';

type Props = {
  reactionName: string;
  targetId: string;
  target: string;
  latestId: string;
  order: OrderEnum;
  limit: number;
};
export class FindReactionsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
