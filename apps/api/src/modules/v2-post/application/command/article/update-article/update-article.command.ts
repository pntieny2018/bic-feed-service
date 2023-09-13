import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { MediaDto } from '../../../../driving-apdater/dto/request';

export type UpdateArticleCommandPayload = {
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

export class UpdateArticleCommand implements ICommand {
  public constructor(public readonly payload: UpdateArticleCommandPayload) {}
}
