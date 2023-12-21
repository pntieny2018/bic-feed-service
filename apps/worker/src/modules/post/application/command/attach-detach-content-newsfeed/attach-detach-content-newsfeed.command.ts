import { ICommand } from '@nestjs/cqrs';

export type AttachDetachContentNewsfeedPayload = {
  contentId: string;
  oldGroupIds: string[];
  newGroupIds: string[];
  limit: number;
};
export class AttachDetachContentNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: AttachDetachContentNewsfeedPayload) {}
}
