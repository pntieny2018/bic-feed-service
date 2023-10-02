import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

export class GetTotalDraftQuery implements IQuery {
  public constructor(public readonly user: UserDto) {}
}
