import { ICommand } from '@nestjs/cqrs';
import { MediaDto } from '../../../../media/dto/media.dto';
import { UserMentionDto } from '../../../../mention/dto/user-mention.dto';

export type CreateCommentCommandPayload = {
  postId: string;

  content?: string;

  media?: MediaDto;

  mentions?: UserMentionDto[];

  giphyId?: string;
};

export class CreateCommentCommand implements ICommand {
  public constructor(public readonly payload: CreateCommentCommandPayload) {}
}
