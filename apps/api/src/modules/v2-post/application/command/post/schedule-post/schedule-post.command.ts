import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { PostPayload } from '../../../../domain/domain-service/interface';

export type SchedulePostCommandPayload = PostPayload & {
  actor: UserDto;
  scheduledAt: Date;
};

export class SchedulePostCommand implements ICommand {
  public constructor(public readonly payload: SchedulePostCommandPayload) {}
}
