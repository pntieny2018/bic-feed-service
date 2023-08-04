import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type UpdateCommentCommandPayload = {
  id: string;
  actor: UserDto;
  content?: string;
  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };
  mentions?: string[];
  giphyId?: string;
};

export class UpdateCommentCommand implements ICommand {
  public constructor(public readonly payload: UpdateCommentCommandPayload) {}
}
