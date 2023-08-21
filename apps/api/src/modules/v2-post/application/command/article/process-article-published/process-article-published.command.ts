import { ICommand } from '@nestjs/cqrs';

import { ArticleChangedMessagePayload } from '../../../dto/message';

export class ProcessArticlePublishedCommand implements ICommand {
  public constructor(public readonly payload: ArticleChangedMessagePayload) {}
}
