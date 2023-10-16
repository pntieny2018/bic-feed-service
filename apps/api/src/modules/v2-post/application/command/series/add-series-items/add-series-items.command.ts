import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type AddSeriesItemsCommandPayload = {
  authUser: UserDto;
  itemId: string;
  id: string;
};

export class AddSeriesItemsCommand implements ICommand {
  public constructor(public readonly payload: AddSeriesItemsCommandPayload) {}
}
