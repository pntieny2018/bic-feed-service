import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

class GetWelcomeContentsPayload {
  public authUser: UserDto;
}

export class GetWelcomeContentsQuery implements IQuery {
  public constructor(public readonly payload: GetWelcomeContentsPayload) {}
}
