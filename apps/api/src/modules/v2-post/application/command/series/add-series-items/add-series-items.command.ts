import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application/user.dto';

export type AddSeriesItemsCommandPayload = {
  authUser: UserDto;
  itemIds: string[];
  id: string;
};

export class AddSeriesItemsCommand implements ICommand {
  public constructor(public readonly payload: AddSeriesItemsCommandPayload) {}
}
