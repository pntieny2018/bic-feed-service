import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type UsersSeenContentPayload = {
  contentId: string;
  authUser: UserDto;
  limit: number;
  offset: number;
};

export class UsersSeenContentQuery implements IQuery {
  public constructor(public readonly payload: UsersSeenContentPayload) {}
}
