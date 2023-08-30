import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application/user.dto';

export type ReplyCommentCommandPayload = {
  actor: UserDto;

  postId: string;

  parentId: string;

  content?: string;

  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };

  mentions?: string[];

  giphyId?: string;
};

export class ReplyCommentCommand implements ICommand {
  public constructor(public readonly payload: ReplyCommentCommandPayload) {}
}
