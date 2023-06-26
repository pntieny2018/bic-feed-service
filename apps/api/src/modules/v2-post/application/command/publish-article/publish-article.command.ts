import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application/user.dto';
import { MediaDto } from '../../../driving-apdater/dto/request';

export type PublishArticleCommandPayload = {
  id: string;

  actor: UserDto;

  title?: string;

  summary?: string;

  content?: string;

  categories?: string[];

  series?: string[];

  tags?: string[];

  groupIds?: string[];

  coverMedia?: MediaDto;

  wordCount?: number;
};

export class PublishArticleCommand implements ICommand {
  public constructor(public readonly payload: PublishArticleCommandPayload) {}
}
