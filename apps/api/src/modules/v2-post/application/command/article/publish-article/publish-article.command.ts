import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { ArticlePayload } from '../../../../domain/domain-service/interface';

export type PublishArticleCommandPayload = ArticlePayload & { actor: UserDto };

export class PublishArticleCommand implements ICommand {
  public constructor(public readonly payload: PublishArticleCommandPayload) {}
}
