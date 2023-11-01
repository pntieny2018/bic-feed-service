import { ICommand } from '@nestjs/cqrs';

export type RemovePostToNewsfeedPayload = {
  contentId: string;
  userId: string;
};
export class RemoveContentToNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: RemovePostToNewsfeedPayload) {}
}
