import { ICommand } from '@nestjs/cqrs';

export type PublishPostToNewsfeedPayload = {
  contentId: string;
  userId: string;
};
export class PublishContentToNewsfeedCommand implements ICommand {
  public constructor(public readonly payload: PublishPostToNewsfeedPayload) {}
}
