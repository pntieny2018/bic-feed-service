import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application/user.dto';

export type RemoveSeriesItemsCommandPayload = {
  authUser: UserDto;
  itemIds: string[];
  id: string;
};

export class RemoveSeriesItemsCommand implements ICommand {
  public constructor(public readonly payload: RemoveSeriesItemsCommandPayload) {}
}
