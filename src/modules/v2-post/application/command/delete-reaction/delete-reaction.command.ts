import { ICommand } from '@nestjs/cqrs';
import { ReactionEnum } from '../../../../reaction/reaction.enum';

export type DeleteReactionCommandPayload = {
  targetId: string;
  target: ReactionEnum;
  reactionId?: string;
  reactionName?: string;
};
export class DeleteReactionCommand implements ICommand {
  public constructor(public readonly payload: DeleteReactionCommandPayload) {}
}
