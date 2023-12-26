import { ICommand } from '@nestjs/cqrs';

export type ProducerAttachDetachNewsfeedPaylod = {
  contentId: string;
  oldGroupIds: string[];
  newGroupIds: string[];
};

export class ProducerAttachDetachNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: ProducerAttachDetachNewsfeedPaylod) {}
}
