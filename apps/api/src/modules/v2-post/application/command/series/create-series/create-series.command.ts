import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { MediaDto } from '../../../../driving-apdater/dto/request';
import { PostSettingDto } from '../../../dto';

export type CreateSeriesCommandPayload = {
  actor: UserDto;

  groupIds: string[];

  title: string;

  summary?: string;

  coverMedia: MediaDto;

  setting?: PostSettingDto;
};

export class CreateSeriesCommand implements ICommand {
  public constructor(public readonly payload: CreateSeriesCommandPayload) {}
}
