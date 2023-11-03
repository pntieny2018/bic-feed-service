import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type FindPinnedContentProps = {
  authUser: UserDto;
  groupId: string;
};

export class FindPinnedContentQuery implements IQuery {
  public constructor(public readonly payload: FindPinnedContentProps) {}
}
