import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';
import { ArticlePayload } from '../../../../domain/domain-service/interface';

export type ScheduleArticleCommandPayload = ArticlePayload & {
  actor: UserDto;
  scheduledAt: Date;
};

export class ScheduleArticleCommand implements ICommand {
  public constructor(public readonly payload: ScheduleArticleCommandPayload) {}
}
