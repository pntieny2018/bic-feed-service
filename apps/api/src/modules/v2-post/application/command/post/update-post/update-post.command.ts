import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';
import { PostPayload } from '../../../../domain/domain-service/interface';

export type UpdatePostCommandPayload = PostPayload & {
  authUser: UserDto;
};

export class UpdatePostCommand implements ICommand {
  public constructor(public readonly payload: UpdatePostCommandPayload) {}
}
