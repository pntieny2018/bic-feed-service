import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type ReorderSeriesItemsCommandPayload = {
  authUser: UserDto;
  itemIds: string[];
  id: string;
};

export class ReorderSeriesItemsCommand implements ICommand {
  public constructor(public readonly payload: ReorderSeriesItemsCommandPayload) {}
}
