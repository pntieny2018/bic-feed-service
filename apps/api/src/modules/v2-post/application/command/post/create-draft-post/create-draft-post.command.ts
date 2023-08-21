import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

export type CreateDraftPostCommandPayload = {
  groupIds: string[];
  authUser: UserDto;
};
export class CreateDraftPostCommand implements ICommand {
  public constructor(public readonly payload: CreateDraftPostCommandPayload) {}
}
