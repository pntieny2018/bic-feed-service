import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

import { BasedCommentPayload } from '../../../../domain/domain-service/interface';

export type UpdateCommentCommandPayload = {
  commentId: string;
  actor: UserDto;
} & Omit<BasedCommentPayload, 'userId'>;

export class UpdateCommentCommand implements ICommand {
  public constructor(public readonly payload: UpdateCommentCommandPayload) {}
}
