import { ICommand } from '@nestjs/cqrs';

export type RemoveContentFromNewsfeedPayload = {
  contentId: string;
  userId: string;
};
export class RemoveContentFromNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: RemoveContentFromNewsfeedPayload) {}
}
