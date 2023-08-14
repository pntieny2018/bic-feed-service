import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../v2-user/application';

export type CreateDraftPostCommandPayload = {
  authUser: UserDto;
};
export class CreateDraftArticleCommand implements ICommand {
  public constructor(public readonly payload: CreateDraftPostCommandPayload) {}
}
