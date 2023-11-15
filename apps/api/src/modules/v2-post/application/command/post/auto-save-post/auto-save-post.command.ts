import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { PostPayload } from '../../../../domain/domain-service/interface';

export type AutoSavePostCommandPayload = PostPayload & {
  authUser: UserDto;
};
export class AutoSavePostCommand implements ICommand {
  public constructor(public readonly payload: AutoSavePostCommandPayload) {}
}
