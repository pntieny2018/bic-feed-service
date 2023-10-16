import { ICommand } from '@nestjs/cqrs';

import { ArticleChangedMessagePayload } from '../../../dto/message';

export class ProcessArticleDeletedCommand implements ICommand {
  public constructor(public readonly payload: ArticleChangedMessagePayload) {}
}
