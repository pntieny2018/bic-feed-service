import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  groupId: string;
  authUser: UserDto;
};
export class FindTimelineGroupQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
