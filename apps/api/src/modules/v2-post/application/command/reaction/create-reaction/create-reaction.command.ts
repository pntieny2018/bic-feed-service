import { CONTENT_TARGET } from '@beincom/constants';
import { ICommand } from '@nestjs/cqrs';

export type CreateReactionCommandPayload = {
  reactionName: string;
  target: CONTENT_TARGET;
  targetId: string;
  createdBy: string;
};
export class CreateReactionCommand implements ICommand {
  public constructor(public readonly payload: CreateReactionCommandPayload) {}
}
