import { CONTENT_TARGET } from '@beincom/constants';
import { ICommand } from '@nestjs/cqrs';

export type DeleteReactionCommandPayload = {
  userId: string;
  targetId: string;
  target: CONTENT_TARGET;
  reactionId?: string;
  reactionName: string;
};
export class DeleteReactionCommand implements ICommand {
  public constructor(public readonly payload: DeleteReactionCommandPayload) {}
}
