import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { MediaDto } from '../../../../driving-apdater/dto/request';

export type UpdateSeriesCommandPayload = {
  actor: UserDto;

  id: string;

  groupIds?: string[];

  title?: string;

  summary?: string;

  coverMedia?: MediaDto;
};

export class UpdateSeriesCommand implements ICommand {
  public constructor(public readonly payload: UpdateSeriesCommandPayload) {}
}
