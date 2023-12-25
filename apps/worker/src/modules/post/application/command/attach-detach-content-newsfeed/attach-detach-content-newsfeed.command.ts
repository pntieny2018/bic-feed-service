import { ICommand } from '@nestjs/cqrs';

import { NewsfeedAction } from '../../../data-type';

export type AttachDetachContentNewsfeedPayload = {
  queryParams: {
    groupIds: string[];
    notInGroupIds: string[];
    offset: number;
    limit: number;
  };
  contentId: string;
  action: NewsfeedAction;
};
export class AttachDetachContentNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: AttachDetachContentNewsfeedPayload) {}
}
