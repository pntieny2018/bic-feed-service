import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type ReorderPinnedContentCommandPayload = {
  authUser: UserDto;
  groupId: string;
  contentIds: string[];
};

export class ReorderPinnedContentCommand implements ICommand {
  public constructor(public readonly payload: ReorderPinnedContentCommandPayload) {}
}
