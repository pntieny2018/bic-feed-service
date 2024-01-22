import { ICommand } from '@nestjs/cqrs';

import { NewsfeedAction } from '../../../data-type';
import { ContentNewsFeedAttributes } from '../../../domain/repositoty-interface';

export type AttachDetachContentNewsfeedPayload = {
  queryParams: {
    groupIds: string[];
    notInGroupIds: string[];
    offset: number;
    limit: number;
  };
  content: ContentNewsFeedAttributes;
  action: NewsfeedAction;
};
export class AttachDetachContentNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: AttachDetachContentNewsfeedPayload) {}
}
