import { ICommand } from '@nestjs/cqrs';
import { MediaDto } from '../../../../media/dto/media.dto';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type UpdateCommentCommandPayload = {
  id: string;

  actor: UserDto;

  content?: string;

  media?: MediaDto;

  mentions?: string[];

  giphyId?: string;
};

export class UpdateCommentCommand implements ICommand {
  public constructor(public readonly payload: UpdateCommentCommandPayload) {}
}
