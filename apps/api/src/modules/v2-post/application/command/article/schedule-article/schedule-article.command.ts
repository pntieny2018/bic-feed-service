import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { ArticlePayload } from '../../../../domain/domain-service/interface';

export type ScheduleArticleCommandPayload = ArticlePayload & {
  actor: UserDto;
  scheduledAt: Date;
};

export class ScheduleArticleCommand implements ICommand {
  public constructor(public readonly payload: ScheduleArticleCommandPayload) {}
}
