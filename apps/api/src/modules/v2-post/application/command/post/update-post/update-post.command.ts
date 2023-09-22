import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { PostPayload } from '../../../../domain/domain-service/interface';

export type UpdatePostCommandPayload = PostPayload & {
  authUser: UserDto;
};

export class UpdatePostCommand implements ICommand {
  public constructor(public readonly payload: UpdatePostCommandPayload) {}
}
