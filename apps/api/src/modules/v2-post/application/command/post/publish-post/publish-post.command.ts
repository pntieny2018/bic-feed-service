import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { PostPayload } from '../../../../domain/domain-service/interface';

export type PublishPostCommandPayload = PostPayload & { actor: UserDto };

export class PublishPostCommand implements ICommand {
  public constructor(public readonly payload: PublishPostCommandPayload) {}
}
