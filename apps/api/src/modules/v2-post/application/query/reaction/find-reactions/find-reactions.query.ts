import { CONTENT_TARGET, ORDER } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  reactionName: string;
  targetId: string;
  target: CONTENT_TARGET;
  latestId: string;
  order: ORDER;
  limit: number;
};
export class FindReactionsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
