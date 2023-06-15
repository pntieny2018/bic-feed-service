import { ICommand } from '@nestjs/cqrs';
import { ReactionDto } from '../../dto';

export type CreateReactionCommandPayload = {
  action: 'create' | 'delete';
  reaction: ReactionDto;
};
export class ProcessReactionNotificationCommand implements ICommand {
  public constructor(public readonly payload: CreateReactionCommandPayload) {}
}
