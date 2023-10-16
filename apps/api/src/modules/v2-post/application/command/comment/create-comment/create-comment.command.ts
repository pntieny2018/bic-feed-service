import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application/user.dto';

export type CreateCommentCommandPayload = {
  actor: UserDto;

  postId: string;

  content?: string;

  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };

  mentions?: string[];

  giphyId?: string;
};

export class CreateCommentCommand implements ICommand {
  public constructor(public readonly payload: CreateCommentCommandPayload) {}
}
