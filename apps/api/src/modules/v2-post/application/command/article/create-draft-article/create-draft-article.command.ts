import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type CreateDraftPostCommandPayload = {
  authUser: UserDto;
};
export class CreateDraftArticleCommand implements ICommand {
  public constructor(public readonly payload: CreateDraftPostCommandPayload) {}
}
