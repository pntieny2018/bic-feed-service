import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { BasedCommentPayload } from '../../../../domain/domain-service/interface';

export type ReplyCommentCommandPayload = {
  actor: UserDto;
} & Omit<BasedCommentPayload, 'userId'>;

export class ReplyCommentCommand implements ICommand {
  public constructor(public readonly payload: ReplyCommentCommandPayload) {}
}
