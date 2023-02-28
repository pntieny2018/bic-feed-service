import { ICommand } from '@nestjs/cqrs';
import { ReactionEnum } from '../../../../reaction/reaction.enum';

export type CreateReactionCommandPayload = {
  reactionName: string;
  target: ReactionEnum;
  targetId: string;
  createdBy: string;
};
export class CreateReactionCommand implements ICommand {
  public constructor(public readonly payload: CreateReactionCommandPayload) {}
}
