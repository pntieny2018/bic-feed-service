import { CONTENT_TARGET } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type CreateReactionCommandPayload = {
  reactionName: string;
  target: CONTENT_TARGET;
  targetId: string;
  authUser: UserDto;
};
export class CreateReactionCommand implements ICommand {
  public constructor(public readonly payload: CreateReactionCommandPayload) {}
}
