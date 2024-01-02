import { ICommand } from '@nestjs/cqrs';

import { ContentNewsFeedAttributes } from '../../../domain/repositoty-interface';

export type ProducerAttachDetachNewsfeedPaylod = {
  content: ContentNewsFeedAttributes;
  oldGroupIds: string[];
  newGroupIds: string[];
};

export class ProducerAttachDetachNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: ProducerAttachDetachNewsfeedPaylod) {}
}
