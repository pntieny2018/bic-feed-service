import { ICommand } from '@nestjs/cqrs';

import { REACTION_TARGET } from '../../../data-type';

export type DeleteReactionCommandPayload = {
  userId: string;
  targetId: string;
  target: REACTION_TARGET;
  reactionId?: string;
  reactionName: string;
};
export class DeleteReactionCommand implements ICommand {
  public constructor(public readonly payload: DeleteReactionCommandPayload) {}
}
