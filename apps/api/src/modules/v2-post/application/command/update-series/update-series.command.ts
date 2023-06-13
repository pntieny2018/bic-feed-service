import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application/user.dto';
import { PostSettingDto } from '../../dto';
import { MediaDto } from '../../../driving-apdater/dto/request';

export type UpdateSeriesCommandPayload = {
  actor: UserDto;

  id: string;

  groupIds?: string[];

  title?: string;

  summary?: string;

  coverMedia?: MediaDto;

  setting?: PostSettingDto;
};

export class UpdateSeriesCommand implements ICommand {
  public constructor(public readonly payload: UpdateSeriesCommandPayload) {}
}
