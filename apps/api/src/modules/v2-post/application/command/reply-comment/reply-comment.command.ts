import { ICommand } from '@nestjs/cqrs';
import { MediaDto } from '../../../../media/dto/media.dto';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type ReplyCommentCommandPayload = {
  actor: UserDto;

  postId: string;

  parentId: string;

  content?: string;

  media?: MediaDto;

  mentions?: string[];

  giphyId?: string;
};

export class ReplyCommentCommand implements ICommand {
  public constructor(public readonly payload: ReplyCommentCommandPayload) {}
}
