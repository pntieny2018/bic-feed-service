import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type DeleteSeriesCommandPayload = {
  id: string;

  actor: UserDto;
};

export class DeleteSeriesCommand implements ICommand {
  public constructor(public readonly payload: DeleteSeriesCommandPayload) {}
}
