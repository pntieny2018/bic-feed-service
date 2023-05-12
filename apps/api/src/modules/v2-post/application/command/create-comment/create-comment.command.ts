import { ICommand } from '@nestjs/cqrs';
import { MediaDto } from '../../../../media/dto/media.dto';
import { UserMentionDto } from '../../../../mention/dto/user-mention.dto';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type CreateCommentCommandPayload = {
  actor: UserDto;

  postId: string;

  content?: string;

  media?: MediaDto;

  mentions?: UserMentionDto[];

  giphyId?: string;
};

export class CreateCommentCommand implements ICommand {
  public constructor(public readonly payload: CreateCommentCommandPayload) {}
}
