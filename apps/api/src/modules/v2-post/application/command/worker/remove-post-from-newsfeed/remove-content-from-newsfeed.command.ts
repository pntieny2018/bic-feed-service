import { ICommand } from '@nestjs/cqrs';

export type RemovePostFromNewsfeedPayload = {
  contentId: string;
  userId: string;
};
export class RemoveContentFromNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: RemovePostFromNewsfeedPayload) {}
}
