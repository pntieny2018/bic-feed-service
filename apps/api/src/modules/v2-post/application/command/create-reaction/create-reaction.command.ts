import { ICommand } from '@nestjs/cqrs';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';

export type CreateReactionCommandPayload = {
  reactionName: string;
  target: REACTION_TARGET;
  targetId: string;
  createdBy: string;
};
export class CreateReactionCommand implements ICommand {
  public constructor(public readonly payload: CreateReactionCommandPayload) {}
}
