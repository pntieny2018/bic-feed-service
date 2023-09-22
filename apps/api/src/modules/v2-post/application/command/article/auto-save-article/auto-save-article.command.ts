import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { ArticlePayload } from '../../../../domain/domain-service/interface';

export type AutoSaveArticleCommandPayload = ArticlePayload & { actor: UserDto };

export class AutoSaveArticleCommand implements ICommand {
  public constructor(public readonly payload: AutoSaveArticleCommandPayload) {}
}
