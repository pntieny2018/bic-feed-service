import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type DeleteSeriesCommandPayload = {
  id: string;

  actor: UserDto;
};

export class DeleteSeriesCommand implements ICommand {
  public constructor(public readonly payload: DeleteSeriesCommandPayload) {}
}
