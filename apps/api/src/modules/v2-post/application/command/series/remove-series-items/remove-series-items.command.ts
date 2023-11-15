import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type RemoveSeriesItemsCommandPayload = {
  authUser: UserDto;
  itemId: string;
  id: string;
};

export class RemoveSeriesItemsCommand implements ICommand {
  public constructor(public readonly payload: RemoveSeriesItemsCommandPayload) {}
}
