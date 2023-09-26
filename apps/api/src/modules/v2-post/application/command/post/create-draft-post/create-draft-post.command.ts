import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type CreateDraftPostCommandPayload = {
  groupIds: string[];
  authUser: UserDto;
};
export class CreateDraftPostCommand implements ICommand {
  public constructor(public readonly payload: CreateDraftPostCommandPayload) {}
}
